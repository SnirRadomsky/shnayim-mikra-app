package com.shnayimmikra.app

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import java.util.Calendar

/** Weekly reading reminder, scheduled with AlarmManager and re-armed on every fire / boot. */
object Reminder {
    const val PREFS = "sm_prefs"
    const val KEY_PARSHA = "current_parsha"
    private const val CHANNEL_ID = "weekly_reminder"

    fun save(ctx: Context, enabled: Boolean, day: Int, hour: Int, minute: Int) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putBoolean("rem_enabled", enabled)
            .putInt("rem_day", day)
            .putInt("rem_hour", hour)
            .putInt("rem_minute", minute)
            .apply()
    }

    fun reschedule(ctx: Context) {
        val prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pi = pendingIntent(ctx)
        am.cancel(pi)
        if (!prefs.getBoolean("rem_enabled", false)) return

        val day = prefs.getInt("rem_day", 4)      // 0=Sunday .. 6=Shabbat (JS convention)
        val hour = prefs.getInt("rem_hour", 20)
        val minute = prefs.getInt("rem_minute", 0)

        val cal = Calendar.getInstance().apply {
            set(Calendar.DAY_OF_WEEK, day + 1)    // Calendar.SUNDAY == 1
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            if (timeInMillis <= System.currentTimeMillis()) add(Calendar.DAY_OF_YEAR, 7)
        }
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.timeInMillis, pi)
    }

    fun notifyNow(ctx: Context) {
        val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= 26) {
            nm.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, "תזכורת שבועית", NotificationManager.IMPORTANCE_DEFAULT)
            )
        }
        val parsha = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_PARSHA, null)
        val text = if (parsha != null) "הגיע הזמן לקרוא שניים מקרא ואחד תרגום — פרשת $parsha"
        else "הגיע הזמן לקרוא שניים מקרא ואחד תרגום"

        val open = PendingIntent.getActivity(
            ctx, 0, Intent(ctx, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notif = android.app.Notification.Builder(ctx, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("שניים מקרא ואחד תרגום")
            .setContentText(text)
            .setContentIntent(open)
            .setAutoCancel(true)
            .build()
        runCatching { nm.notify(1, notif) }
    }

    private fun pendingIntent(ctx: Context): PendingIntent = PendingIntent.getBroadcast(
        ctx, 0, Intent(ctx, ReminderReceiver::class.java),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
}

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Reminder.notifyNow(context)
        Reminder.reschedule(context)   // arm next week's alarm
    }
}

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) Reminder.reschedule(context)
    }
}
