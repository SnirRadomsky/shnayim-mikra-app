# שניים מקרא ואחד תרגום

Free, offline, **ad-free** Android app for reading the weekly parashah
שניים מקרא ואחד תרגום — modeled after the classic reading apps, plus a set of
"smart" features people actually ask for.

The app is a self-contained web app (`web/`) wrapped in a tiny WebView shell
(`android/`). Everything —
Torah text with te'amim, Targum Onkelos, Rashi, haftarot, the parashah
calendar until 2046 — is bundled inside the APK. **No internet is ever
needed, no ads, no tracking.**

A ready-to-install debug APK is in [`releases/shnayim-mikra-debug.apk`](releases/shnayim-mikra-debug.apk).

## Features

Everything from the reference screenshots:

- **תרגום** — Onkelos and/or Rashi per verse (each toggleable)
- **קריאה לפי** — verse-by-verse (פסוק פסוק) or whole-aliyah passes (עליות)
- **הצג פסוק** — once or twice (auto-doubled, like printed שמו"ת chumashim)
- **טעמים** — with/without cantillation marks (nikud always kept)
- **הפטרה** — on/off, with **Ashkenaz/Sephard** minhag selection
- **גודל כתב** stepper, **מהירות גלילה** stepper
- **גלילה אוטומטית** — play/pause bar with speed control (hideable)
- **צבעים מיוחדים** — custom colors for Onkelos / Rashi / Mikra + "צבעים מקוריים" reset
- **גופן** — פרנק-רוהל (Frank Ruehl CLM), כתר (Keter YG), עזרא (Ezra SIL) — all
  with full te'amim glyph support
- **מיקום** — Israel / diaspora parashah schedule (handles doubled parshiyot)
- **שפה** — Hebrew / English UI
- **התראות** — weekly reading reminder (day + time) + notification permission shortcut
- **אפס מיקום שמור אחרי שבת** — auto-advance to the new week's parashah after Shabbat
- Bookmark (סימניה), full-screen zen reading mode, chapter headings, פ/ס markers

Smart extras (based on user requests found in reviews/forums of existing apps):

- **Per-aliyah progress tracking** — "סיימתי עלייה זו" button at the end of each
  aliyah (or auto-mark on scroll-to-end), progress %, resume exactly where you left off
- **Progress screen** — aliyah grid for the week, week streak, total parshiyot
  completed, verses left this week, history of recent weeks
- **לוח קריאה יומי** — aliyah-per-day plan (Sunday=ראשון … Shabbat=שביעי) with a
  daily banner and one-tap jump
- **View filter** — הכל / מקרא בלבד / תרגום בלבד (read all mikra first, then all targum)
- **Vezot Haberakhah** appears in the schedule on Simchat Torah (IL/diaspora aware)
- Dark mode + sepia themes, keep-screen-on option

## Text sources

| Text | Edition (via Sefaria) |
| --- | --- |
| מקרא | Tanach with Ta'amei Hamikra |
| תרגום אונקלוס | Metsudah Publications, 2009 |
| רש"י | Rosenbaum–Silbermann, 1929 |
| הפטרות | Tanach with Ta'amei Hamikra |
| לוח פרשות + עליות + הפטרות | [@hebcal/core](https://github.com/hebcal/hebcal-es6) + [@hebcal/leyning](https://github.com/hebcal/hebcal-leyning) |

Fonts: Frank Ruehl CLM & Keter YG ([Culmus](https://culmus.sourceforge.io/), GPL
with font exception), Ezra SIL (OFL). Licenses bundled in `web/fonts/`.

## Building

### Regenerate the data (optional — output is committed)

```bash
cd tools && npm install && npm run build-data   # writes web/data/*.json
```

### Run the web app in a browser

```bash
cd web && python3 -m http.server 8777   # open http://localhost:8777
```

### Run the end-to-end tests (54 checks, Playwright)

```bash
cd web && python3 -m http.server 8777 &
cd tools && npm install && npm test
```

### Build the APK

```bash
cd android
./gradlew assembleDebug     # → app/build/outputs/apk/debug/app-debug.apk
```

Requires an Android SDK (compileSdk 34); point `local.properties` at it.

## Android shell

`MainActivity` serves the bundled assets through `WebViewAssetLoader`
(https origin → localStorage & fetch work normally) and exposes a small JS
bridge (`window.SMNative`):

- `openNotificationSettings()` — system notification settings for the app
- `setReminder(enabled, day, hour, minute)` — weekly AlarmManager reminder
  (re-armed after each fire and on boot)
- `setKeepScreenOn(bool)`, `setCurrentParsha(name)` (used in the reminder text)

הטקסטים נבדקו מול המקורות אך ייתכנו טעויות. אין לסמוך על האפליקציה לקריאה בציבור.
