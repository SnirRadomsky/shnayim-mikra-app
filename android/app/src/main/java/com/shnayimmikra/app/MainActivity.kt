package com.shnayimmikra.app

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.webkit.WebViewAssetLoader

/**
 * WebView shell that loads the bundled Shnayim Mikra web app fully offline.
 *
 * Assets are served via [WebViewAssetLoader] under https://appassets.androidplatform.net/
 * (instead of file://) so localStorage, fetch() and modern web APIs work like in a browser.
 * A small JS bridge (window.SMNative) exposes notifications / keep-screen-on to the web app.
 */
class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this).apply {
            layoutParams = android.view.ViewGroup.LayoutParams(
                android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                android.view.ViewGroup.LayoutParams.MATCH_PARENT
            )
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)
            }
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                cacheMode = WebSettings.LOAD_DEFAULT
                textZoom = 100
                useWideViewPort = false
                loadWithOverviewMode = false
                builtInZoomControls = false
            }
            addJavascriptInterface(Bridge(), "SMNative")
            // the web app now draws its own scroll-position indicator (the zen minimap);
            // the native overlay scrollbar just duplicated it at the same edge.
            isVerticalScrollBarEnabled = false
            overScrollMode = View.OVER_SCROLL_NEVER
            loadUrl(APP_URL)
        }

        setContentView(webView)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    inner class Bridge {

        @JavascriptInterface
        fun openNotificationSettings() {
            requestNotifPermissionIfNeeded()
            val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                .putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            runCatching { startActivity(intent) }
        }

        @JavascriptInterface
        fun setKeepScreenOn(on: Boolean) {
            runOnUiThread {
                if (on) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }

        /** day: 0=Sunday .. 6=Shabbat (matches JS Date.getDay()) */
        @JavascriptInterface
        fun setReminder(enabled: Boolean, day: Int, hour: Int, minute: Int) {
            if (enabled) requestNotifPermissionIfNeeded()
            Reminder.save(this@MainActivity, enabled, day, hour, minute)
            Reminder.reschedule(this@MainActivity)
        }

        @JavascriptInterface
        fun setCurrentParsha(name: String) {
            getSharedPreferences(Reminder.PREFS, MODE_PRIVATE)
                .edit().putString(Reminder.KEY_PARSHA, name).apply()
        }
    }

    private fun requestNotifPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) !=
            android.content.pm.PackageManager.PERMISSION_GRANTED
        ) {
            runOnUiThread {
                requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 1)
            }
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        webView.restoreState(savedInstanceState)
    }

    companion object {
        private const val APP_URL = "https://appassets.androidplatform.net/assets/index.html"
    }
}
