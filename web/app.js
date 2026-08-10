/* שניים מקרא ואחד תרגום — offline reader.
 * Data: Sefaria (Tanach with Ta'amei Hamikra / Metsudah Onkelos / Silbermann Rashi),
 * schedule + aliyot via @hebcal (precomputed into data/*.json).
 */
'use strict';

// ---------------------------------------------------------------- constants
const ALIYAH_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי', 'הפטרה'];
const ALIYAH_EN = ['Rishon', 'Sheni', 'Shlishi', "Revi'i", 'Chamishi', 'Shishi', "Shvi'i", 'Haftarah'];
// "עלייה" is feminine, so "end of aliyah" needs the feminine ordinal form (שלישית, not שלישי)
const ALIYAH_HE_FEM = ['ראשונה', 'שנייה', 'שלישית', 'רביעית', 'חמישית', 'שישית', 'שביעית'];
// one distinct color per aliyah (1-7), used by the "how big is each aliyah" pie chart
const ALIYAH_COLORS = ['#4e79a7', '#f28e2b', '#59a14f', '#e15759', '#af7aa1', '#76b7b2', '#edc948'];
const TORAH_BOOKS = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'];
const BOOK_HE = {
  Genesis: 'בראשית', Exodus: 'שמות', Leviticus: 'ויקרא', Numbers: 'במדבר', Deuteronomy: 'דברים',
  Joshua: 'יהושע', Judges: 'שופטים', 'I Samuel': 'שמואל א', 'II Samuel': 'שמואל ב',
  'I Kings': 'מלכים א', 'II Kings': 'מלכים ב', Isaiah: 'ישעיהו', Jeremiah: 'ירמיהו',
  Ezekiel: 'יחזקאל', Hosea: 'הושע', Joel: 'יואל', Amos: 'עמוס', Obadiah: 'עובדיה',
  Micah: 'מיכה', Habakkuk: 'חבקוק', Zechariah: 'זכריה', Malachi: 'מלאכי',
};
const DAY_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const DAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Shabbat'];

const STR = {
  he: {
    settings: 'הגדרות', targum: 'תרגום', onkelos: 'אונקולוס', rashi: 'רש"י',
    fontSize: 'גודל הכתב', scrollSpeed: 'מהירות גלילה', readBy: 'קריאה לפי',
    byVerse: 'פסוק פסוק', byAliyah: 'עליות', teamim: 'טעמים', with: 'עם', without: 'בלי',
    haftara: 'הפטרה', minhag: 'מנהג:', ashkenaz: 'אשכנז', sephard: 'ספרד',
    showVerse: 'הצג פסוק', once: 'פעם אחת', twice: 'פעמיים', language: 'שפה',
    specialColors: 'צבעים מיוחדים', onkelosC: 'אונקולוס:', rashiC: 'רש"י:', mikraC: 'מקרא:',
    origColors: 'צבעים מקוריים', theme: 'ערכת נושא', light: 'בהיר', dark: 'כהה', sepia: 'ספיה',
    location: 'מיקום', israel: 'ישראל', abroad: 'מחוץ לישראל',
    notifications: 'התראות', notifPerm: 'לשינוי הרשאות התראות', weeklyReminder: 'תזכורת שבועית',
    thursday: 'יום חמישי', friday: 'יום שישי', sunday: 'יום ראשון', monday: 'יום שני',
    tuesday: 'יום שלישי', wednesday: 'יום רביעי',
    font: 'גופן', autoScrollBar: 'הצג שורת גלילה אוטומטית', yes: 'כן', no: 'לא',
    resetAfterShabbat: 'אפס מיקום שמור אחרי שבת',
    resetHint: 'במוצאי שבת האפליקציה תעבור אוטומטית לפרשה של השבוע החדש.',
    smart: 'חכם', dailyPlan: 'לוח קריאה יומי (עלייה ליום)', keepAwake: 'השאר מסך דולק בזמן קריאה',
    autoMark: 'סמן עלייה כהושלמה אוטומטית בסוף גלילה',
    progress: 'התקדמות השבוע', progressGeneral: 'התקדמות כללית', chooseParsha: 'בחר פרשה', close: 'סגור',
    menuToday: 'לפרשת השבוע', menuProgress: 'התקדמות השבוע', menuProgressGeneral: 'התקדמות כללית', menuBookmark: 'עבור לסימניה',
    menuFontUp: 'הגדל כתב', menuFontDown: 'הקטן כתב', menuSettings: 'הגדרות', menuAbout: 'אודות',
    autoScroll: 'גלילה אוטומטית:', speed: 'מהירות:',
    all: 'הכל', mikraOnly: 'מקרא', targumOnly: 'תרגום',
    mikraFirst: 'מקרא — פעם ראשונה', mikraSecond: 'מקרא — פעם שנייה', mikraOnce: 'מקרא',
    onkelosSec: 'תרגום אונקלוס', rashiSec: 'רש"י',
    doneAliyah: 'סיימתי עלייה זו ✓', doneHaftara: 'סיימתי את ההפטרה ✓', aliyahDoneAlready: 'הושלם ✓',
    parshaDone: 'סיימת את כל הפרשה! 🎉',
    noBookmark: 'אין סימניה שמורה', chapter: 'פרק',
    todayRead: 'היום ({day}): עלייה {aliyah}', go: 'עבור',
    streak: 'רצף שבועות', doneParshiot: 'פרשות שהושלמו', versesLeft: 'פסוקים שנותרו השבוע',
    thisWeek: 'פרשת השבוע', history: 'שבועות אחרונים',
    stFull: 'הושלם', stPart: 'חלקי', stNone: '—',
    haftaraIn: 'הפטרה ב{book}', minhagNote: 'מנהג {minhag}',
    loading: 'טוען…', movedToWeek: 'עברנו לפרשת השבוע: {parsha}',
    reminderSet: 'התזכורת נקבעה', reminderOff: 'התזכורת בוטלה',
    endOfAliyah: 'סוף עלייה', notifNA: 'התראות זמינות רק באפליקציה',
    targumBg: 'רקע לתרגום', mikra2C: 'מקרא (פעם ב\'):', menuTeamim: 'שמות הטעמים',
    lastVerseRepeat: 'חזרת הפסוק האחרון', bookmarkAdded: 'הסימניה נוספה',
    bookmarkRemoved: 'הסימניה הוסרה', bookmarkLabel: 'סימניה', versesWord: 'פסוקים',
    zenProgressBar: 'הצג פס התקדמות במסך מלא',
    zenMinimapLabel: 'הצג מפת גודל עלייה במסך מלא',
    zenMinimapWholeLabel: 'הצג בה את כל העלייה (גם אם הטקסט יהיה קטן מאוד)',
    parashaSizeShort: 'פרשה קצרה', parashaSizeMedium: 'פרשה בינונית', parashaSizeLong: 'פרשה ארוכה',
  },
  en: {
    settings: 'Settings', targum: 'Targum', onkelos: 'Onkelos', rashi: 'Rashi',
    fontSize: 'Font size', scrollSpeed: 'Scroll speed', readBy: 'Read by',
    byVerse: 'Verse by verse', byAliyah: 'Aliyot', teamim: 'Cantillation', with: 'With', without: 'Without',
    haftara: 'Haftarah', minhag: 'Custom:', ashkenaz: 'Ashkenaz', sephard: 'Sephard',
    showVerse: 'Show verse', once: 'Once', twice: 'Twice', language: 'Language',
    specialColors: 'Special colors', onkelosC: 'Onkelos:', rashiC: 'Rashi:', mikraC: 'Mikra:',
    origColors: 'Original colors', theme: 'Theme', light: 'Light', dark: 'Dark', sepia: 'Sepia',
    location: 'Location', israel: 'Israel', abroad: 'Outside Israel',
    notifications: 'Notifications', notifPerm: 'Notification permissions', weeklyReminder: 'Weekly reminder',
    thursday: 'Thursday', friday: 'Friday', sunday: 'Sunday', monday: 'Monday',
    tuesday: 'Tuesday', wednesday: 'Wednesday',
    font: 'Font', autoScrollBar: 'Show auto-scroll bar', yes: 'Yes', no: 'No',
    resetAfterShabbat: 'Reset saved position after Shabbat',
    resetHint: 'After Shabbat the app will automatically move to the new week\'s parashah.',
    smart: 'Smart', dailyPlan: 'Daily plan (aliyah per day)', keepAwake: 'Keep screen on while reading',
    autoMark: 'Auto-mark aliyah complete at end of scroll',
    progress: 'This Week\'s Progress', progressGeneral: 'Overall Progress', chooseParsha: 'Choose parashah', close: 'Close',
    menuToday: 'This week\'s parashah', menuProgress: 'This Week\'s Progress', menuProgressGeneral: 'Overall Progress', menuBookmark: 'Go to bookmark',
    menuFontUp: 'Increase font', menuFontDown: 'Decrease font', menuSettings: 'Settings', menuAbout: 'About',
    autoScroll: 'Auto-scroll:', speed: 'Speed:',
    all: 'All', mikraOnly: 'Mikra', targumOnly: 'Targum',
    mikraFirst: 'Mikra — first reading', mikraSecond: 'Mikra — second reading', mikraOnce: 'Mikra',
    onkelosSec: 'Targum Onkelos', rashiSec: 'Rashi',
    doneAliyah: 'Finished this aliyah ✓', doneHaftara: 'Finished the haftarah ✓', aliyahDoneAlready: 'Completed ✓',
    parshaDone: 'You finished the whole parashah! 🎉',
    noBookmark: 'No saved bookmark', chapter: 'Chapter',
    todayRead: 'Today ({day}): aliyah {aliyah}', go: 'Go',
    streak: 'Week streak', doneParshiot: 'Parshiot completed', versesLeft: 'Verses left this week',
    thisWeek: 'This week\'s parashah', history: 'Recent weeks',
    stFull: 'Done', stPart: 'Partial', stNone: '—',
    haftaraIn: 'Haftarah in {book}', minhagNote: '{minhag} custom',
    loading: 'Loading…', movedToWeek: 'Moved to this week\'s parashah: {parsha}',
    reminderSet: 'Reminder set', reminderOff: 'Reminder cancelled',
    endOfAliyah: 'End of aliyah', notifNA: 'Notifications are available only in the app',
    targumBg: 'Targum background', mikra2C: 'Mikra (2nd time):', menuTeamim: "Te'amim names",
    lastVerseRepeat: 'Repeat of the last verse', bookmarkAdded: 'Bookmark added',
    bookmarkRemoved: 'Bookmark removed', bookmarkLabel: 'Bookmark', versesWord: 'verses',
    zenProgressBar: 'Show progress bar in fullscreen',
    zenMinimapLabel: 'Show aliyah-size map in fullscreen',
    zenMinimapWholeLabel: 'Show the whole aliyah in it (even if the text gets very small)',
    parashaSizeShort: 'Short parasha', parashaSizeMedium: 'Medium parasha', parashaSizeLong: 'Long parasha',
  },
};

const DEFAULTS = {
  onkelos: true, rashi: false, fontSize: 54, speed: 55, mode: 'pasuk',
  teamim: 'with', haftara: 'without', minhag: 'seph', twice: 'twice', lang: 'he',
  colors: { light: {}, dark: {}, sepia: {} }, theme: 'light', loc: 'il',
  reminderOn: false, reminderDay: 4, reminderTime: '20:00',
  font: 'frank', scrollbar: 'yes', autoAdvance: 'yes',
  dailyPlan: false, keepAwake: true, autoMark: true, viewFilter: 'all',
  targumBg: 'yes', zenProgress: false, zenMinimap: true, zenMinimapPinned: false,
  zenMinimapWhole: false,
};

// ---------------------------------------------------------------- state
let S = loadJSON('sm_settings', {});
S = Object.assign({}, DEFAULTS, S);
// colors used to be one flat set shared by every theme, which caused dark-mode text to
// become invisible if a dark-ish color was picked while in light theme (it "stuck" across
// themes). Migrate any old flat shape into a per-theme {light,dark,sepia} structure.
if (S.colors && !S.colors.light && !S.colors.dark && !S.colors.sepia) {
  S.colors = { light: S.colors, dark: {}, sepia: {} };
} else {
  S.colors = Object.assign({ light: {}, dark: {}, sepia: {} }, S.colors);
}
let PARSHIYOT = null, SCHEDULE = null, HAFTAROT = null;
const bookCache = {};
let pos = loadJSON('sm_pos', null);       // {loc, idx, aliyah, scroll}
let progress = loadJSON('sm_prog', {});   // "date|key" -> {a:[bool x8]}
let bookmarks = loadJSON('sm_bookmarks', null);
if (!bookmarks) {
  // migrate the old single-bookmark format
  const old = loadJSON('sm_bookmark', null);
  bookmarks = old ? [{ loc: old.loc, idx: old.idx, aliyah: old.aliyah, c: 0, v: 0, scroll: old.scroll, ts: 0 }] : [];
  saveJSON('sm_bookmarks', bookmarks);
}
let scrolling = false, scrollRAF = 0, lastTs = 0, scrollRemainder = 0;
let longPressTimer = null;
let teamimNusach = S.minhag === 'ashk' ? 'ashk' : 'seph';
let wakeLock = null;
let renderSeq = 0;

// ---------------------------------------------------------------- helpers
function $(id) { return document.getElementById(id); }
function loadJSON(k, dflt) {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : dflt; } catch (e) { return dflt; }
}
function saveJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function saveSettings() { saveJSON('sm_settings', S); }
function savePos() {
  // remember which "week" (upcoming Shabbat) the position was saved in, so we
  // only auto-advance after an actual Shabbat has passed, not on every reopen.
  if (SCHEDULE) pos.week = sched()[currentWeekIdx()][0];
  saveJSON('sm_pos', pos);
}
function saveProgress() { saveJSON('sm_prog', progress); }
function saveBookmarks() { saveJSON('sm_bookmarks', bookmarks); }
function findBookmark(c, v) {
  return bookmarks.findIndex(b => b.loc === S.loc && b.idx === pos.idx && b.aliyah === pos.aliyah && b.c === c && b.v === v);
}
function isVerseBookmarked(c, v) { return findBookmark(c, v) >= 0; }
// only one bookmark at a time: marking a new verse replaces the previous bookmark
function toggleVerseBookmark(c, v) {
  const i = findBookmark(c, v);
  if (i >= 0) {
    bookmarks.splice(i, 1);
    toast(t('bookmarkRemoved'));
  } else {
    bookmarks = [{ loc: S.loc, idx: pos.idx, aliyah: pos.aliyah, c, v, ts: Date.now() }];
    toast(t('bookmarkAdded'));
  }
  saveBookmarks();
  renderReader(true);
}
function bookmarkRibbonHTML(c, v) {
  return isVerseBookmarked(c, v) ? `<span class="bmRibbon">🔖 ${t('bookmarkLabel')}</span>` : '';
}
function t(key, vars) {
  let s = (STR[S.lang] && STR[S.lang][key]) || STR.he[key] || key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace('{' + k + '}', v);
  return s;
}
function toast(msg, ms) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add('hidden'), ms || 2200);
}

// Hebrew numerals (1..999). withQuotes: add gershayim (for chapter headings).
function gematria(n, withQuotes) {
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const hunds = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
  let s = hunds[Math.floor(n / 100)] || '';
  let r = n % 100;
  if (r === 15) s += 'טו';
  else if (r === 16) s += 'טז';
  else s += tens[Math.floor(r / 10)] + ones[r % 10];
  if (withQuotes && s.length >= 2) s = s.slice(0, -1) + '"' + s.slice(-1);
  else if (withQuotes && s.length === 1) s += "'";
  return s;
}

const TEAMIM_RE = /[֑-ֽ֯׀]/g;
function stripTeamim(s) {
  return s.replace(TEAMIM_RE, '').replace(/ +/g, ' ').replace(/ ([:׃])/g, '$1');
}
// split out {פ}/{ס} markers, return {text, mark}
function splitPMark(s) {
  const m = s.match(/\{(פ|ס)\}/);
  return { text: s.replace(/\s*\{(פ|ס)\}\s*/g, ' ').trim(), mark: m ? m[1] : null };
}
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function fmtDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y.slice(2)}`;
}

// ---------------------------------------------------------------- data
async function fetchData(name) {
  const res = await fetch('data/' + name);
  if (!res.ok) throw new Error('failed loading ' + name);
  return res.json();
}
async function loadBook(book) {
  if (!bookCache[book]) bookCache[book] = await fetchData('torah/' + book + '.json');
  return bookCache[book];
}
async function loadHaftarot() {
  if (!HAFTAROT) HAFTAROT = await fetchData('haftarot.json');
  return HAFTAROT;
}

function sched() { return SCHEDULE[S.loc]; }
function currentWeekIdx() {
  const today = todayISO();
  const arr = sched();
  for (let i = 0; i < arr.length; i++) if (arr[i][0] >= today) return i;
  return arr.length - 1;
}
function entry() { return sched()[pos.idx]; }
function meta() { return PARSHIYOT[entry()[1]]; }
function progKey(e) { return e[0] + '|' + e[1]; }
function progOf(e) {
  const k = progKey(e);
  if (!progress[k]) progress[k] = { a: [false, false, false, false, false, false, false, false] };
  return progress[k];
}
function aliyahCount() { return S.haftara === 'with' ? 8 : 7; }

function versesForRange(bookData, range) {
  const out = [];
  for (let c = range.b[0]; c <= range.e[0]; c++) {
    const ch = bookData.chapters[c - 1] || [];
    const vs = c === range.b[0] ? range.b[1] : 1;
    const ve = c === range.e[0] ? range.e[1] : ch.length;
    for (let v = vs; v <= ve; v++) {
      const vd = ch[v - 1] || { m: '', t: '', r: [] };
      out.push({ c, v, m: vd.m, t: vd.t, r: vd.r });
    }
  }
  return out;
}

// ---------------------------------------------------------------- rendering
function mikraHTML(vd, cls) {
  const { text, mark } = splitPMark(vd.m);
  const body = S.teamim === 'without' ? stripTeamim(text) : text;
  return `<span class="${cls}">${esc(body)}</span>${mark ? ` <span class="pmark">(${mark})</span>` : ''}`;
}

function verseBlockHTML(vd, showMikra, showTargum) {
  const marked = isVerseBookmarked(vd.c, vd.v);
  let h = `<div class="verse${marked ? ' bookmarked' : ''}" data-cv="${vd.c}:${vd.v}">`;
  if (marked) h += bookmarkRibbonHTML(vd.c, vd.v);
  h += `<span class="vnum">${gematria(vd.v)}</span>`;
  const parts = [];
  if (showMikra) {
    parts.push(mikraHTML(vd, 'mikra'));
    if (S.twice === 'twice' && showTargum) parts.push(mikraHTML(vd, 'mikra2'));
  }
  if (showTargum && S.onkelos && vd.t) parts.push(`<span class="targum">${esc(vd.t)}</span>`);
  h += parts.join(' &nbsp;');
  h += '</div>';
  if (showTargum && S.rashi && vd.r && vd.r.length) {
    h += `<div class="rashi">${vd.r.map(r => sanitizeRashi(r)).join('<br>')}</div>`;
  }
  return h;
}
function sanitizeRashi(s) {
  // data was pre-cleaned to only contain <b>/<i>; escape everything else
  return esc(s).replace(/&lt;(\/?[bi])&gt;/g, '<$1>');
}

function renderAliyahMode(verses, showMikra, showTargum) {
  let h = '';
  const passes = [];
  if (showMikra) {
    passes.push({ head: (S.twice === 'twice' && showTargum) ? t('mikraFirst') : t('mikraOnce'), type: 'm1' });
    if (S.twice === 'twice' && showTargum) passes.push({ head: t('mikraSecond'), type: 'm2' });
  }
  if (showTargum && S.onkelos) passes.push({ head: t('onkelosSec'), type: 't' });
  if (showTargum && S.rashi) passes.push({ head: t('rashiSec'), type: 'r' });
  for (const pass of passes) {
    h += `<div class="sectionhead">${pass.head}</div>`;
    let lastC = 0;
    for (const vd of verses) {
      if (pass.type === 'r' && (!vd.r || !vd.r.length)) continue;
      if (vd.c !== lastC) {
        h += `<div class="chapterhead">${t('chapter')} ${gematria(vd.c, true)}</div>`;
        lastC = vd.c;
      }
      const marked = isVerseBookmarked(vd.c, vd.v);
      const cls = 'verse' + (marked ? ' bookmarked' : '');
      const ribbon = marked ? bookmarkRibbonHTML(vd.c, vd.v) : '';
      if (pass.type === 'm1' || pass.type === 'm2') {
        h += `<div class="${cls}" data-cv="${vd.c}:${vd.v}">${ribbon}<span class="vnum">${gematria(vd.v)}</span>${mikraHTML(vd, pass.type === 'm1' ? 'mikra' : 'mikra2')}</div>`;
      } else if (pass.type === 't') {
        if (vd.t) h += `<div class="${cls}" data-cv="${vd.c}:${vd.v}">${ribbon}<span class="vnum">${gematria(vd.v)}</span><span class="targum">${esc(vd.t)}</span></div>`;
      } else {
        h += `<div class="${cls}" data-cv="${vd.c}:${vd.v}">${ribbon}<span class="vnum">${gematria(vd.v)}</span></div><div class="rashi">${vd.r.map(sanitizeRashi).join('<br>')}</div>`;
      }
    }
  }
  return h;
}

async function renderReader(keepScroll, scrollToCV) {
  const seq = ++renderSeq;
  const content = $('content');
  const m = meta();
  const e = entry();
  stopAutoScroll();

  // nav labels
  $('parshaName').textContent = m.he;
  $('aliyahName').textContent = (S.lang === 'he' ? ALIYAH_HE : ALIYAH_EN)[pos.aliyah];

  content.innerHTML = `<div class="endnote">${t('loading')}</div>`;

  let html = '';
  if (pos.aliyah === 7) {
    // haftara
    const haft = await loadHaftarot();
    if (seq !== renderSeq) return;
    const hd = haft[e[1]];
    const segs = (S.minhag === 'ashk' ? hd.a : hd.s) || [];
    const label = S.minhag === 'ashk' ? m.haftAshkLabel : m.haftSephLabel;
    html += `<div class="haftNote">${esc(label)} · ${t('minhagNote', { minhag: t(S.minhag === 'ashk' ? 'ashkenaz' : 'sephard') })}</div>`;
    for (const seg of segs) {
      html += `<div class="chapterhead">${BOOK_HE[seg.k] || seg.k}</div>`;
      let lastC = 0;
      for (const vd of seg.verses) {
        if (vd.c !== lastC) {
          html += `<div class="chapterhead">${t('chapter')} ${gematria(vd.c, true)}</div>`;
          lastC = vd.c;
        }
        html += `<div class="verse"><span class="vnum">${gematria(vd.v)}</span>${mikraHTML({ m: vd.t }, 'mikra')}</div>`;
      }
    }
  } else {
    const bookData = await loadBook(m.book);
    if (seq !== renderSeq) return;
    const verses = versesForRange(bookData, m.aliyot[pos.aliyah]);
    const showMikra = S.viewFilter !== 'targum';
    const showTargum = S.viewFilter !== 'mikra';
    if (S.mode === 'aliyah') {
      html += renderAliyahMode(verses, showMikra, showTargum);
    } else {
      let lastC = 0;
      for (const vd of verses) {
        if (vd.c !== lastC) {
          html += `<div class="chapterhead">${t('chapter')} ${gematria(vd.c, true)}</div>`;
          lastC = vd.c;
        }
        html += verseBlockHTML(vd, showMikra, showTargum);
      }
    }
    // custom: repeat the mikra of the parsha's very last verse (end of the 7th aliyah)
    if (pos.aliyah === 6 && showMikra && verses.length) {
      const lastVd = verses[verses.length - 1];
      html += `<div class="sectionhead">${t('lastVerseRepeat')}</div>`;
      html += `<div class="verse">${mikraHTML(lastVd, 'mikra')} &nbsp;${mikraHTML(lastVd, 'mikra2')}</div>`;
    }
  }

  // end-of-aliyah button
  const done = progOf(e).a[pos.aliyah];
  html += `<button class="aliyahDone${done ? ' done' : ''}" id="btnAliyahDone">${
    done ? t('aliyahDoneAlready') : (pos.aliyah === 7 ? t('doneHaftara') : t('doneAliyah'))}</button>`;
  const endLabel = pos.aliyah === 7
    ? (S.lang === 'he' ? 'סוף ההפטרה' : 'End of the Haftarah')
    : (S.lang === 'he' ? `${t('endOfAliyah')} ${ALIYAH_HE_FEM[pos.aliyah]}` : `${t('endOfAliyah')} (${ALIYAH_EN[pos.aliyah]})`);
  html += `<div class="endnote">${endLabel} · ${m.he}</div>`;

  content.innerHTML = html;
  $('btnAliyahDone').addEventListener('click', onAliyahDone);
  // when jumping to a specific verse (e.g. a bookmark), scroll to it in this same
  // synchronous pass — never paint an intermediate scrollTop:0 frame first, which is
  // what used to cause a visible "jump" back to the top of the aliyah before landing.
  const target = scrollToCV && content.querySelector(`.verse[data-cv="${scrollToCV}"]`);
  if (target) {
    target.scrollIntoView({ block: 'center' });
    pos.scroll = content.scrollTop;
  } else {
    content.scrollTop = keepScroll ? (pos.scroll || 0) : 0;
    if (!keepScroll) pos.scroll = 0;
  }
  savePos();
  updateProgressChip();
  updateNavButtons();
  updateScrollProgress();
  syncMinimap(true);
}

// how many verses of `verses` are read up to and including (c,v) — used to give a bookmark
// partial credit within its (not-yet-marked-done) aliyah, instead of only counting whole aliyot
function verseIndexInRange(verses, c, v) {
  const idx = verses.findIndex(vd => vd.c === c && vd.v === v);
  return idx < 0 ? 0 : idx + 1;
}

// a CSS conic-gradient pie chart: one slice per count, sized by its share of the total
function buildPieGradient(counts, colors) {
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  const stops = counts.map((c, i) => {
    const start = (acc / total * 360).toFixed(2);
    acc += c;
    const end = (acc / total * 360).toFixed(2);
    return `${colors[i % colors.length]} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${stops.join(', ')})`;
}

// total verse counts for every parasha in PARSHIYOT, computed once per session (needs all
// 5 Torah books loaded) and used to classify the current parasha as short/medium/long
// relative to all the others (by verse-count tercile).
let parashaSizeInfo = null;
async function getParashaSizeInfo() {
  if (parashaSizeInfo) return parashaSizeInfo;
  const books = {};
  await Promise.all(TORAH_BOOKS.map(async b => { books[b] = await loadBook(b); }));
  const sizes = {};
  for (const key of Object.keys(PARSHIYOT)) {
    const pm = PARSHIYOT[key];
    if (!pm.aliyot || !books[pm.book]) continue;
    sizes[key] = pm.aliyot.reduce((sum, rng) => sum + versesForRange(books[pm.book], rng).length, 0);
  }
  const sorted = Object.values(sizes).sort((a, b) => a - b);
  parashaSizeInfo = {
    sizes,
    p33: sorted[Math.floor(sorted.length * 0.33)],
    p66: sorted[Math.floor(sorted.length * 0.66)],
  };
  return parashaSizeInfo;
}
function classifyParashaSize(total, info) {
  if (total <= info.p33) return 'short';
  if (total <= info.p66) return 'medium';
  return 'long';
}
const PARASHA_SIZE_KEY = { short: 'parashaSizeShort', medium: 'parashaSizeMedium', long: 'parashaSizeLong' };

// verse-level progress across the whole parasha (all 7 aliyot) — a bookmark gives its
// (not-yet-done) aliyah partial credit up to that verse. Shared by the reader's progress
// chip and the weekly Progress page's ring + per-aliyah bars, so they always agree.
async function computeParashaProgress() {
  const e = entry(), m = meta();
  const p = progOf(e);
  const bm = bookmarks[0];
  const bmHere = bm && bm.loc === S.loc && bm.idx === pos.idx ? bm : null;
  const bd = await loadBook(m.book);
  const perAliyah = [];
  let total = 0, read = 0;
  for (let i = 0; i < 7; i++) {
    const verses = versesForRange(bd, m.aliyot[i]);
    const count = verses.length;
    let done = 0;
    if (p.a[i]) done = count;
    else if (bmHere && bmHere.aliyah === i) done = verseIndexInRange(verses, bmHere.c, bmHere.v);
    total += count;
    read += done;
    perAliyah.push({ count, done, pct: count ? Math.round(done / count * 100) : 0 });
  }
  return { meta: m, total, read, overallPct: total ? Math.round(read / total * 100) : 0, perAliyah };
}

async function updateProgressChip() {
  const r = await computeParashaProgress();
  if (meta() !== r.meta) return; // parasha changed while we were awaiting
  $('progressChip').textContent = r.overallPct + '%';
}

// how far scrolled through the current aliyah's page (independent of aliyah-completion progress)
function updateScrollProgress() {
  const c = $('content');
  const max = c.scrollHeight - c.clientHeight;
  const pct = max > 0 ? Math.min(100, Math.max(0, (c.scrollTop / max) * 100)) : 0;
  $('scrollProgressFill').style.width = pct + '%';
  $('zenProgressFill').style.width = pct + '%';
}

function updateNavButtons() {
  $('parshaPrev').disabled = pos.idx <= 0;
  $('parshaNext').disabled = pos.idx >= sched().length - 1;
}

// ---------------------------------------------------------------- navigation
function gotoParsha(idx, aliyah) {
  pos.idx = Math.max(0, Math.min(sched().length - 1, idx));
  pos.aliyah = Math.max(0, Math.min(aliyahCount() - 1, aliyah || 0));
  pos.scroll = 0;
  pos.loc = S.loc;
  savePos();
  renderReader();
}
function gotoAliyah(a) {
  if (a < 0) {
    if (pos.idx > 0) gotoParsha(pos.idx - 1, aliyahCount() - 1);
    return;
  }
  if (a > aliyahCount() - 1) {
    if (pos.idx < sched().length - 1) gotoParsha(pos.idx + 1, 0);
    return;
  }
  pos.aliyah = a;
  pos.scroll = 0;
  savePos();
  renderReader();
}

function onAliyahDone() {
  const e = entry();
  const p = progOf(e);
  const wasDone = p.a[pos.aliyah];
  p.a[pos.aliyah] = true;
  saveProgress();
  updateProgressChip();
  const n = aliyahCount();
  const all = p.a.slice(0, n).every(Boolean);
  if (all) {
    toast(t('parshaDone'), 3200);
    renderReader(true);
  } else if (!wasDone && pos.aliyah < n - 1) {
    gotoAliyah(pos.aliyah + 1);
  } else {
    renderReader(true);
  }
}

// mark the current aliyah done in-place, without navigating away (used when
// reaching the end of the page passively — via auto-scroll or manual scroll)
function markAliyahDoneQuiet() {
  const p = progOf(entry());
  if (!p.a[pos.aliyah]) {
    p.a[pos.aliyah] = true;
    saveProgress();
    updateProgressChip();
    const btn = $('btnAliyahDone');
    if (btn) { btn.classList.add('done'); btn.textContent = t('aliyahDoneAlready'); }
  }
}

// ---------------------------------------------------------------- auto scroll
function pxPerSec() { return 6 + S.speed * 1.8; }
function setPlayButtonsState(playing) {
  [$('btnPlay'), $('zenPlayBtn')].forEach(b => {
    if (!b) return;
    b.textContent = playing ? '❚❚' : '▶';
    b.classList.toggle('playing', playing);
  });
}
function startAutoScroll() {
  scrolling = true;
  setPlayButtonsState(true);
  lastTs = 0; scrollRemainder = 0;
  const step = ts => {
    if (!scrolling) return;
    if (lastTs) {
      const dt = (ts - lastTs) / 1000;
      const c = $('content');
      scrollRemainder += pxPerSec() * dt;
      const px = Math.floor(scrollRemainder);
      if (px > 0) {
        c.scrollTop += px;
        scrollRemainder -= px;
        if (c.scrollTop + c.clientHeight >= c.scrollHeight - 2) {
          stopAutoScroll();
          if (S.autoMark) markAliyahDoneQuiet();
          return;
        }
      }
    }
    lastTs = ts;
    scrollRAF = requestAnimationFrame(step);
  };
  scrollRAF = requestAnimationFrame(step);
}
function stopAutoScroll() {
  if (scrolling) {
    // the debounced scroll-position save below never fires while auto-scroll is running
    // (every animation frame resets its timer), so pos.scroll would otherwise still hold
    // whatever position we were at when auto-scroll *started* — sync it now, before
    // anything (e.g. a bookmark-triggered re-render) reads pos.scroll and jumps back there.
    pos.scroll = $('content').scrollTop;
    savePos();
  }
  scrolling = false;
  cancelAnimationFrame(scrollRAF);
  setPlayButtonsState(false);
}
function setSpeed(v) {
  S.speed = Math.max(1, Math.min(100, v));
  $('speedVal').textContent = S.speed;
  $('speedVal2').textContent = S.speed;
  saveSettings();
}

// ---------------------------------------------------------------- progress page (this week's parasha)
const RING_R = 84, RING_C = 2 * Math.PI * RING_R;
function setRingPct(circleEl, labelEl, pct) {
  if (circleEl) {
    circleEl.style.strokeDasharray = String(RING_C);
    circleEl.style.strokeDashoffset = String(RING_C * (1 - pct / 100));
  }
  if (labelEl) labelEl.textContent = pct + '%';
}

// places each aliyah's ordinal-name label directly over its pie slice, at the slice's
// angular midpoint — so the diagram is self-labeled and doesn't need a separate legend.
// Matches the CSS conic-gradient convention: 0deg = 12 o'clock, increasing clockwise.
function positionAliyahPieLabels(el, counts, names) {
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  const LABEL_R = 32; // label placement radius, as % of the diagram's width/height
  let acc = 0;
  let html = '';
  counts.forEach((c, i) => {
    const start = acc / total * 360;
    acc += c;
    const end = acc / total * 360;
    const mid = (start + end) / 2;
    const rad = mid * Math.PI / 180;
    const x = 50 + LABEL_R * Math.sin(rad);
    const y = 50 - LABEL_R * Math.cos(rad);
    html += `<span class="aliyahPieLabelItem" style="left:${x}%;top:${y}%">${names[i]}</span>`;
  });
  el.innerHTML = html;
}

function renderProgress() {
  const body = $('progressBody');
  const e = entry();
  const m = meta();
  const p = progOf(e);
  const n = aliyahCount();
  const names = S.lang === 'he' ? ALIYAH_HE : ALIYAH_EN;
  // highlight the aliyah currently holding the bookmark
  const bm = bookmarks[0];
  const bmAliyah = (bm && bm.loc === S.loc && bm.idx === pos.idx && !p.a[bm.aliyah]) ? bm.aliyah : -1;

  let rows = '';
  for (let i = 0; i < n; i++) {
    const pct0 = p.a[i] ? 100 : 0;
    rows += `<button class="alrow${p.a[i] ? ' done' : ''}${i === bmAliyah ? ' bookmarked' : ''}" data-al="${i}">
      <div class="alrowtop">
        <span class="alrowname">${names[i]}${p.a[i] ? ' ✓' : ''}</span>
        <span class="alrowpct" data-alpct="${i}">${pct0}%</span>
      </div>
      <div class="alrowbar"><div class="alrowfill" data-alfill="${i}" style="width:${pct0}%"></div></div>
      <div class="alrowverses" data-alverses="${i}"></div>
    </button>`;
  }

  body.innerHTML = `
    <div class="progCombo">
      <svg viewBox="0 0 200 200" class="progComboSvg">
        <circle class="progRingBg" cx="100" cy="100" r="${RING_R}"></circle>
        <circle class="progRingFill" id="progRingFill" cx="100" cy="100" r="${RING_R}"></circle>
      </svg>
      <div class="aliyahPie" id="aliyahPie"></div>
      <div class="aliyahPieLabels" id="aliyahPieLabels"></div>
      <div class="progComboLabel"><div class="n" id="progRingPct">0%</div></div>
    </div>
    <h3 class="progweektitle">${m.he} <span class="parashaSizeBadge" id="parashaSizeBadge"></span></h3>
    <div class="progringsub" id="versesLeftN">…</div>
    <div class="alrows">${rows}</div>`;

  body.querySelectorAll('.alrow').forEach(c => c.addEventListener('click', () => {
    const i = +c.dataset.al;
    p.a[i] = !p.a[i];
    saveProgress();
    renderProgress();
    updateProgressChip();
  }));

  computeParashaProgress().then(r => {
    if (meta() !== r.meta) return;
    r.perAliyah.forEach((a, i) => {
      const pctEl = body.querySelector(`[data-alpct="${i}"]`);
      const fillEl = body.querySelector(`[data-alfill="${i}"]`);
      const versesEl = body.querySelector(`[data-alverses="${i}"]`);
      if (pctEl) pctEl.textContent = a.pct + '%';
      if (fillEl) fillEl.style.width = a.pct + '%';
      if (versesEl) versesEl.textContent = `${a.count} ${t('versesWord')}`;
    });
    setRingPct(body.querySelector('#progRingFill'), body.querySelector('#progRingPct'), r.overallPct);
    const versesLeftEl = body.querySelector('#versesLeftN');
    if (versesLeftEl) versesLeftEl.textContent = `${r.total - r.read} ${t('versesLeft')}`;

    // how big each aliyah is relative to the others in this parasha (a static fact, not
    // tied to reading progress) — a 7-slice pie chart, self-labeled on the slices
    const counts = r.perAliyah.map(a => a.count);
    const pieEl = body.querySelector('#aliyahPie');
    if (pieEl) pieEl.style.background = buildPieGradient(counts, ALIYAH_COLORS);
    const labelsEl = body.querySelector('#aliyahPieLabels');
    if (labelsEl) positionAliyahPieLabels(labelsEl, counts, names);
  }).catch(() => {});

  // how long this parasha is compared to all the others (short/medium/long by verse-count
  // tercile) — needs every Torah book loaded, so it's cached and computed lazily
  getParashaSizeInfo().then(info => {
    if (meta() !== m) return;
    const total = info.sizes[e[1]];
    if (total == null) return;
    const cls = classifyParashaSize(total, info);
    const badge = body.querySelector('#parashaSizeBadge');
    if (badge) { badge.textContent = t(PARASHA_SIZE_KEY[cls]); badge.className = 'parashaSizeBadge ' + cls; }
  }).catch(() => {});

  if (n === 8) {
    loadHaftarot().then(haft => {
      const hd = haft[e[1]];
      const segs = (S.minhag === 'ashk' ? hd.a : hd.s) || [];
      const count = segs.reduce((sum, seg) => sum + seg.verses.length, 0);
      const pct = p.a[7] ? 100 : 0;
      const pctEl = body.querySelector('[data-alpct="7"]');
      const fillEl = body.querySelector('[data-alfill="7"]');
      const versesEl = body.querySelector('[data-alverses="7"]');
      if (pctEl) pctEl.textContent = pct + '%';
      if (fillEl) fillEl.style.width = pct + '%';
      if (versesEl) versesEl.textContent = `${count} ${t('versesWord')}`;
    }).catch(() => {});
  }
}
function fullyDone(e) {
  const pr = progress[progKey(e)];
  return !!pr && pr.a.slice(0, 7).every(Boolean);
}

// ---------------------------------------------------------------- progress page (overall, across weeks)
function renderProgressGeneral() {
  const body = $('progressGeneralBody');
  const cw = currentWeekIdx();
  const arr = sched();

  // streak: consecutive fully-read weeks before (and including) current week
  const cwDone = fullyDone(arr[cw]);
  let streak = 0;
  for (let i = cw - (cwDone ? 0 : 1); i >= 0; i--) {
    if (fullyDone(arr[i])) streak++;
    else break;
  }
  let total = 0;
  for (const k of Object.keys(progress)) {
    const [, key] = k.split('|');
    const pm = PARSHIYOT[key];
    if (pm && progress[k].a.slice(0, 7).every(Boolean)) total++;
  }

  let hist = '';
  for (let i = Math.max(0, cw - 8); i <= cw; i++) {
    const en = arr[i];
    const pr = progress[progKey(en)];
    const d7 = pr ? pr.a.slice(0, 7).filter(Boolean).length : 0;
    const st = d7 === 7 ? 'full' : d7 > 0 ? 'part' : 'none';
    const stTxt = d7 === 7 ? t('stFull') : d7 > 0 ? `${d7}/7` : t('stNone');
    hist += `<div class="histrow"><span>${fmtDate(en[0])} · ${PARSHIYOT[en[1]].he}</span><span class="st ${st}">${stTxt}</span></div>`;
  }

  body.innerHTML = `
    <div class="progstats">
      <div class="statbox"><div class="n">${streak}</div><div class="l">${t('streak')}</div></div>
      <div class="statbox"><div class="n">${total}</div><div class="l">${t('doneParshiot')}</div></div>
    </div>
    <div class="progparsha"><h3>${t('history')}</h3></div>
    ${hist}`;
}

// ---------------------------------------------------------------- picker
function renderPicker() {
  const list = $('pickerList');
  const arr = sched();
  const from = Math.max(0, pos.idx - 10), to = Math.min(arr.length - 1, pos.idx + 56);
  let h = '';
  for (let i = from; i <= to; i++) {
    const [d, k] = arr[i];
    h += `<button class="pickrow${i === pos.idx ? ' current' : ''}" data-i="${i}">
      <span>${PARSHIYOT[k].he}</span><span class="pd">${fmtDate(d)}</span></button>`;
  }
  list.innerHTML = h;
  list.querySelectorAll('.pickrow').forEach(r => r.addEventListener('click', () => {
    $('pickerModal').classList.add('hidden');
    gotoParsha(+r.dataset.i, 0);
  }));
  const cur = list.querySelector('.current');
  if (cur) setTimeout(() => cur.scrollIntoView({ block: 'center' }), 30);
}

// ---------------------------------------------------------------- day banner
function renderDayBanner() {
  const el = $('dayBanner');
  if (!S.dailyPlan) { el.classList.add('hidden'); return; }
  const dismissed = loadJSON('sm_bannerDismiss', '');
  if (dismissed === todayISO()) { el.classList.add('hidden'); return; }
  const day = new Date().getDay(); // 0=Sun..6=Sat
  const names = S.lang === 'he' ? ALIYAH_HE : ALIYAH_EN;
  const dayNames = S.lang === 'he' ? DAY_HE : DAY_EN;
  $('dayBannerText').textContent = t('todayRead', { day: dayNames[day], aliyah: names[Math.min(day, 6)] });
  el.classList.remove('hidden');
  $('dayBannerGo').onclick = () => { gotoParsha(currentWeekIdx(), Math.min(day, 6)); el.classList.add('hidden'); };
  $('dayBannerClose').onclick = () => { saveJSON('sm_bannerDismiss', todayISO()); el.classList.add('hidden'); };
}

// ---------------------------------------------------------------- native bridge
function native() { return window.SMNative || null; }
function applyKeepAwake() {
  const n = native();
  if (n && n.setKeepScreenOn) { try { n.setKeepScreenOn(!!S.keepAwake); } catch (e) {} }
  if (S.keepAwake && 'wakeLock' in navigator) {
    navigator.wakeLock.request('screen').then(wl => { wakeLock = wl; }).catch(() => {});
  } else if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && S.keepAwake) applyKeepAwake();
});
function applyReminder() {
  const n = native();
  if (!n || !n.setReminder) return;
  try {
    const [h, mm] = (S.reminderTime || '20:00').split(':').map(Number);
    n.setReminder(S.reminderOn, S.reminderDay, h, mm);
  } catch (e) {}
}

// ---------------------------------------------------------------- settings UI
function seg(el, val) {
  el.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.val === val));
}
function bindSeg(id, key, after) {
  const el = $(id);
  el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    S[key] = b.dataset.val;
    seg(el, S[key]);
    saveSettings();
    if (after) after();
  }));
}

// apply the current theme's color overrides as CSS vars (live, e.g. while dragging in
// the custom color picker below) without touching anything else in the DOM.
function applyColorVars() {
  const c = S.colors[S.theme] || (S.colors[S.theme] = {});
  const root = document.documentElement.style;
  if (c.targum) root.setProperty('--targum', c.targum); else root.removeProperty('--targum');
  if (c.rashi) root.setProperty('--rashi', c.rashi); else root.removeProperty('--rashi');
  if (c.mikra) { root.setProperty('--mikra', c.mikra); } else root.removeProperty('--mikra');
  if (c.mikra2) { root.setProperty('--mikra2', c.mikra2); } else root.removeProperty('--mikra2');
}

function applyAll() {
  // theme, font, colors, font size, i18n, bars
  document.documentElement.setAttribute('data-theme', S.theme);
  document.body.setAttribute('data-font', S.font);
  document.documentElement.setAttribute('lang', S.lang);
  document.documentElement.setAttribute('dir', 'rtl'); // app is RTL even in English UI
  $('content').style.fontSize = S.fontSize + 'px';
  document.body.setAttribute('data-targumbg', S.targumBg);
  applyColorVars();
  $('scrollbar').classList.toggle('hidden', S.scrollbar !== 'yes');
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $('fontVal').textContent = S.fontSize;
  $('speedVal').textContent = S.speed;
  $('speedVal2').textContent = S.speed;
  seg($('segMode'), S.mode); seg($('segTeamim'), S.teamim); seg($('segHaftara'), S.haftara);
  seg($('segMinhag'), S.minhag); seg($('segTwice'), S.twice); seg($('segLang'), S.lang);
  seg($('segTheme'), S.theme); seg($('segLoc'), S.loc); seg($('segScrollbar'), S.scrollbar);
  seg($('segAutoAdvance'), S.autoAdvance); seg($('segTargumBg'), S.targumBg);
  $('setOnkelos').checked = S.onkelos;
  $('setRashi').checked = S.rashi;
  $('setDailyPlan').checked = S.dailyPlan;
  $('setKeepAwake').checked = S.keepAwake;
  $('setAutoMark').checked = S.autoMark;
  $('setZenProgress').checked = S.zenProgress;
  updateZenProgressVisibility();
  $('setZenMinimap').checked = S.zenMinimap;
  $('setZenMinimapWhole').checked = S.zenMinimapWhole;
  updateZenMinimapVisibility();
  $('setReminder').checked = S.reminderOn;
  $('remDay').value = String(S.reminderDay);
  $('remTime').value = S.reminderTime;
  $('reminderRow').style.display = S.reminderOn ? '' : 'none';
  const radio = document.querySelector(`input[name=font][value=${S.font}]`);
  if (radio) radio.checked = true;
  const getVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const cc = S.colors[S.theme] || {};
  $('colOnkelos').style.background = cc.targum || rgbToHex(getVar('--targum')) || '#275079';
  $('colRashi').style.background = cc.rashi || rgbToHex(getVar('--rashi')) || '#6a4a1f';
  $('colMikra').style.background = cc.mikra || rgbToHex(getVar('--mikra')) || '#16161a';
  $('colMikra2').style.background = cc.mikra2 || rgbToHex(getVar('--mikra2')) || '#3d5a80';
  $('viewFilter').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.vf === S.viewFilter));
  $('viewFilter').querySelector('[data-vf=all]').textContent = t('all');
  $('viewFilter').querySelector('[data-vf=mikra]').textContent = t('mikraOnly');
  $('viewFilter').querySelector('[data-vf=targum]').textContent = t('targumOnly');
  renderDayBanner();
}
function rgbToHex(c) {
  if (!c) return null;
  if (c.startsWith('#')) return c;
  const m = c.match(/(\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return '#' + [m[1], m[2], m[3]].map(x => (+x).toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------- custom color picker
// Replaces the native <input type=color> (whose hue/saturation drag direction can behave
// oddly inside an Android WebView) with a small self-contained HSV picker we fully control,
// plus a "recent colors" palette shared across all four color slots.
function hexToRgb(hex) {
  hex = (hex || '#000000').replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(ch => ch + ch).join('');
  const n = parseInt(hex, 16) || 0;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}
function hsvToRgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}
function hexToHsv(hex) { const { r, g, b } = hexToRgb(hex); return rgbToHsv(r, g, b); }
function hsvToHex(h, s, v) {
  const { r, g, b } = hsvToRgb(h, s, v);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

const COLOR_VAR = { targum: '--targum', rashi: '--rashi', mikra: '--mikra', mikra2: '--mikra2' };
const COLOR_FALLBACK = { targum: '#275079', rashi: '#6a4a1f', mikra: '#16161a', mikra2: '#3d5a80' };
function effectiveColor(key) {
  const cc = S.colors[S.theme] || {};
  if (cc[key]) return cc[key];
  const v = getComputedStyle(document.documentElement).getPropertyValue(COLOR_VAR[key]).trim();
  return rgbToHex(v) || COLOR_FALLBACK[key];
}
function loadRecentColors() { return loadJSON('sm_recentColors', []); }
function addRecentColor(hex) {
  let arr = loadRecentColors().filter(c => c.toLowerCase() !== hex.toLowerCase());
  arr.unshift(hex);
  saveJSON('sm_recentColors', arr.slice(0, 10));
}
function renderRecentColors() {
  const row = $('cpRecentRow');
  const arr = loadRecentColors();
  row.innerHTML = arr.map(c => `<button type="button" class="cpRecentSwatch" style="background:${c}" data-hex="${c}"></button>`).join('');
  row.querySelectorAll('.cpRecentSwatch').forEach(b => b.addEventListener('click', () => applyPickedColor(b.dataset.hex)));
}

let cpState = null;
function cpUpdateSquareBg() {
  $('cpSquare').style.backgroundColor = `hsl(${cpState.h}, 100%, 50%)`;
}
function cpUpdateThumbs() {
  $('cpSquareThumb').style.left = (cpState.s * 100) + '%';
  $('cpSquareThumb').style.top = ((1 - cpState.v) * 100) + '%';
  $('cpHueThumb').style.left = (cpState.h / 360 * 100) + '%';
}
function cpApplyLive() {
  const hex = hsvToHex(cpState.h, cpState.s, cpState.v);
  S.colors[S.theme][cpState.key] = hex;
  saveSettings();
  applyColorVars();
  $('cpPreview').style.background = hex;
  $('cpHex').value = hex;
  return hex;
}
function applyPickedColor(hex) {
  const { h, s, v } = hexToHsv(hex);
  Object.assign(cpState, { h, s, v });
  cpUpdateSquareBg();
  cpUpdateThumbs();
  cpApplyLive();
}
function openColorPicker(key) {
  const titles = { targum: t('onkelosC'), rashi: t('rashiC'), mikra: t('mikraC'), mikra2: t('mikra2C') };
  $('cpTitle').textContent = titles[key] || '';
  const current = effectiveColor(key);
  const { h, s, v } = hexToHsv(current);
  cpState = { key, h, s, v };
  cpUpdateSquareBg();
  cpUpdateThumbs();
  $('cpPreview').style.background = current;
  $('cpHex').value = current;
  renderRecentColors();
  $('colorPickerModal').classList.remove('hidden');
}
function cpDragHandler(el, onMove) {
  const move = ev => {
    const rect = el.getBoundingClientRect();
    const x = Math.min(rect.width, Math.max(0, ev.clientX - rect.left));
    const y = Math.min(rect.height, Math.max(0, ev.clientY - rect.top));
    onMove(x / rect.width, y / (rect.height || 1));
  };
  el.addEventListener('pointerdown', ev => {
    ev.preventDefault();
    el.setPointerCapture(ev.pointerId);
    move(ev);
    const onMoveEv = e2 => move(e2);
    const onUp = () => {
      el.removeEventListener('pointermove', onMoveEv);
      el.removeEventListener('pointerup', onUp);
    };
    el.addEventListener('pointermove', onMoveEv);
    el.addEventListener('pointerup', onUp);
  });
}
function bindColorPicker() {
  cpDragHandler($('cpSquare'), (fx, fy) => {
    cpState.s = fx; cpState.v = 1 - fy;
    cpUpdateThumbs();
    cpApplyLive();
  });
  cpDragHandler($('cpHue'), fx => {
    cpState.h = fx * 360;
    cpUpdateSquareBg();
    cpUpdateThumbs();
    cpApplyLive();
  });
  $('cpHex').addEventListener('change', ev => {
    const m = ev.target.value.trim().match(/^#?([0-9a-fA-F]{6})$/);
    if (!m) { ev.target.value = effectiveColor(cpState.key); return; }
    applyPickedColor('#' + m[1]);
  });
}

function bindSettings() {
  $('setOnkelos').addEventListener('change', ev => { S.onkelos = ev.target.checked; saveSettings(); renderReader(true); });
  $('setRashi').addEventListener('change', ev => { S.rashi = ev.target.checked; saveSettings(); renderReader(true); });
  $('fontUp').addEventListener('click', () => { S.fontSize = Math.min(120, S.fontSize + 2); saveSettings(); applyAll(); });
  $('fontDown').addEventListener('click', () => { S.fontSize = Math.max(18, S.fontSize - 2); saveSettings(); applyAll(); });
  $('speedUp2').addEventListener('click', () => setSpeed(S.speed + 1));
  $('speedDown2').addEventListener('click', () => setSpeed(S.speed - 1));
  bindSeg('segMode', 'mode', () => renderReader());
  bindSeg('segTeamim', 'teamim', () => renderReader(true));
  bindSeg('segHaftara', 'haftara', () => {
    if (pos.aliyah > aliyahCount() - 1) pos.aliyah = aliyahCount() - 1;
    renderReader();
  });
  bindSeg('segMinhag', 'minhag', () => { if (pos.aliyah === 7) renderReader(); });
  bindSeg('segTwice', 'twice', () => renderReader(true));
  bindSeg('segLang', 'lang', () => { applyAll(); renderReader(true); });
  bindSeg('segTheme', 'theme', () => applyAll());
  bindSeg('segLoc', 'loc', () => {
    // keep same-or-nearest date when switching location (pos.loc still holds the old location)
    const d = SCHEDULE[pos.loc][Math.min(pos.idx, SCHEDULE[pos.loc].length - 1)][0];
    const arr = sched();
    let idx = arr.findIndex(x => x[0] >= d);
    if (idx < 0) idx = arr.length - 1;
    pos.idx = idx; pos.loc = S.loc; pos.aliyah = Math.min(pos.aliyah, aliyahCount() - 1); pos.scroll = 0;
    savePos();
    renderReader();
  });
  bindSeg('segScrollbar', 'scrollbar', () => applyAll());
  bindSeg('segAutoAdvance', 'autoAdvance', () => {});
  bindSeg('segTargumBg', 'targumBg', () => applyAll());
  $('setDailyPlan').addEventListener('change', ev => { S.dailyPlan = ev.target.checked; saveSettings(); renderDayBanner(); });
  $('setKeepAwake').addEventListener('change', ev => { S.keepAwake = ev.target.checked; saveSettings(); applyKeepAwake(); });
  $('setAutoMark').addEventListener('change', ev => { S.autoMark = ev.target.checked; saveSettings(); });
  $('setZenProgress').addEventListener('change', ev => { S.zenProgress = ev.target.checked; saveSettings(); updateZenProgressVisibility(); });
  $('setZenMinimap').addEventListener('change', ev => { S.zenMinimap = ev.target.checked; saveSettings(); updateZenMinimapVisibility(); });
  $('setZenMinimapWhole').addEventListener('change', ev => { S.zenMinimapWhole = ev.target.checked; saveSettings(); syncMinimap(); });
  document.querySelectorAll('input[name=font]').forEach(r => r.addEventListener('change', ev => {
    S.font = ev.target.value; saveSettings(); applyAll();
  }));
  $('colOnkelos').addEventListener('click', () => openColorPicker('targum'));
  $('colRashi').addEventListener('click', () => openColorPicker('rashi'));
  $('colMikra').addEventListener('click', () => openColorPicker('mikra'));
  $('colMikra2').addEventListener('click', () => openColorPicker('mikra2'));
  $('btnResetColors').addEventListener('click', () => { S.colors[S.theme] = {}; saveSettings(); applyAll(); });
  $('btnNotifPerm').addEventListener('click', () => {
    const n = native();
    if (n && n.openNotificationSettings) { try { n.openNotificationSettings(); } catch (e) {} }
    else if ('Notification' in window) Notification.requestPermission();
    else toast(t('notifNA'));
  });
  $('setReminder').addEventListener('change', ev => {
    S.reminderOn = ev.target.checked;
    saveSettings(); applyAll(); applyReminder();
    toast(S.reminderOn ? t('reminderSet') : t('reminderOff'));
  });
  $('remDay').addEventListener('change', ev => { S.reminderDay = +ev.target.value; saveSettings(); applyReminder(); });
  $('remTime').addEventListener('change', ev => { S.reminderTime = ev.target.value; saveSettings(); applyReminder(); });
}

// ---------------------------------------------------------------- ui wiring
function openPage(id) { $(id).classList.remove('hidden'); }
function closeMenu() { $('sideMenu').classList.add('hidden'); $('menuOverlay').classList.add('hidden'); }

function toggleZen() {
  if (document.body.classList.contains('zen')) {
    document.body.classList.remove('zen');
    $('zenExit').classList.add('hidden');
    $('zenPlayBtn').classList.add('hidden');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  } else {
    document.body.classList.add('zen');
    $('zenExit').classList.remove('hidden');
    $('zenPlayBtn').classList.remove('hidden');
    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
  }
  updateZenProgressVisibility();
  updateZenMinimapVisibility();
}
function updateZenProgressVisibility() {
  $('zenProgress').classList.toggle('hidden', !(document.body.classList.contains('zen') && S.zenProgress));
}

// ---------------------------------------------------------------- zen minimap
// A "how big is this aliyah, and where am I in it" indicator, shown only in fullscreen
// (zen) mode: a slim, mostly-transparent bar that blooms — VS Code minimap style — into a
// shrunk real preview of the whole aliyah with the currently-visible slice highlighted,
// while it's being dragged or pinned open. Collapsed, it costs nothing visually or
// perf-wise; expanded, it's rebuilt from a DOM clone so it always matches what's on screen.
const MINIMAP_MAX_TRACK_RATIO = .72; // cap on how much of the viewport height the thumbnail may fill
const MINIMAP_COLLAPSE_MS = 2200;    // idle delay before an unpinned expanded minimap collapses back
let minimapCollapseTimer = 0, minimapDragging = false;

function updateZenMinimapVisibility() {
  const show = document.body.classList.contains('zen') && S.zenMinimap;
  $('zenMinimap').classList.toggle('hidden', !show);
  $('zenMinimapToggle').classList.toggle('hidden', !show);
  $('zenMinimapToggle').classList.toggle('on', S.zenMinimapPinned);
  $('zenMinimap').classList.toggle('expanded', show && S.zenMinimapPinned);
  if (show) syncMinimap(true);
}

function buildMinimapClone() {
  const content = $('content');
  const preview = $('zenMinimapPreview');
  const clone = content.cloneNode(true);
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
  const cs = getComputedStyle(content);
  clone.style.fontFamily = cs.fontFamily;
  clone.style.fontSize = cs.fontSize;
  clone.style.padding = cs.padding;
  clone.style.width = content.scrollWidth + 'px';
  preview.innerHTML = '';
  preview.appendChild(clone);
}

// recompute the minimap's track height / scale / viewport-highlight box. `rebuild` also
// refreshes the cloned text preview (needed after content or font-size changes / resize) —
// skip it on plain scroll, which only has to move the viewport box.
//
// by default the scale is derived from WIDTH only, so glyph shapes stay legible-ish
// regardless of how tall the aliyah is (some readers use very large font sizes, which makes
// scrollHeight huge — shrinking scale to force the *whole* thing into a short track would
// make the preview an invisible hairline). Short aliyot still fit whole in the track at that
// scale; for long ones (or a big font size) the track is capped and the preview pans to keep
// the current viewport box centered, same as a real minimap would. S.zenMinimapWhole opts out
// of panning: it shrinks the scale as far as needed to always show the whole aliyah at once,
// even if that makes the text unreadably small.
function syncMinimap(rebuild) {
  if (!document.body.classList.contains('zen') || !S.zenMinimap) return;
  const content = $('content');
  const track = $('zenMinimapTrack');
  const preview = $('zenMinimapPreview');
  const viewport = $('zenMinimapViewport');
  const scrollW = content.scrollWidth || 1;
  const scrollH = content.scrollHeight || 1;
  if (rebuild || !preview.firstChild) buildMinimapClone();

  const expandedWidth = window.innerWidth >= 700 ? 76 : 58;
  const maxTrackH = window.innerHeight * MINIMAP_MAX_TRACK_RATIO;
  const scale = S.zenMinimapWhole ? Math.min(expandedWidth / scrollW, maxTrackH / scrollH) : expandedWidth / scrollW;
  const fullH = scrollH * scale;
  const trackH = Math.max(40, Math.round(Math.min(fullH, maxTrackH)));

  const maxScroll = Math.max(1, content.scrollHeight - content.clientHeight);
  const ratio = Math.min(1, Math.max(0, content.scrollTop / maxScroll));
  const vpH = Math.max(6, (content.clientHeight / scrollH) * fullH);
  const vpTopFull = ratio * (fullH - vpH);
  const pan = fullH <= trackH ? 0 : Math.min(fullH - trackH, Math.max(0, vpTopFull + vpH / 2 - trackH / 2));

  track.style.height = trackH + 'px';
  preview.style.transform = `translateY(${-pan}px) scale(${scale})`;
  preview.style.width = scrollW + 'px';
  preview.style.height = scrollH + 'px';
  viewport.style.height = Math.round(vpH) + 'px';
  viewport.style.top = Math.round(vpTopFull - pan) + 'px';
}

function expandMinimap(temporary) {
  $('zenMinimap').classList.add('expanded');
  clearTimeout(minimapCollapseTimer);
  if (temporary && !S.zenMinimapPinned) {
    minimapCollapseTimer = setTimeout(() => {
      if (!minimapDragging) $('zenMinimap').classList.toggle('expanded', S.zenMinimapPinned);
    }, MINIMAP_COLLAPSE_MS);
  }
}

function minimapScrubTo(clientY) {
  const rect = $('zenMinimapTrack').getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
  const content = $('content');
  content.scrollTop = ratio * (content.scrollHeight - content.clientHeight);
}

function bindUI() {
  bindColorPicker();
  $('btnMenu').addEventListener('click', () => {
    $('sideMenu').classList.remove('hidden');
    $('menuOverlay').classList.remove('hidden');
  });
  $('menuOverlay').addEventListener('click', closeMenu);
  $('miToday').addEventListener('click', () => { closeMenu(); gotoParsha(currentWeekIdx(), 0); });
  $('miProgress').addEventListener('click', () => { closeMenu(); renderProgress(); openPage('progressPage'); });
  $('miProgressGeneral').addEventListener('click', () => { closeMenu(); renderProgressGeneral(); openPage('progressGeneralPage'); });
  $('miBookmarkGo').addEventListener('click', () => { closeMenu(); goToBookmark(); });
  $('miFontUp').addEventListener('click', () => { S.fontSize = Math.min(120, S.fontSize + 2); saveSettings(); applyAll(); });
  $('miFontDown').addEventListener('click', () => { S.fontSize = Math.max(18, S.fontSize - 2); saveSettings(); applyAll(); });
  $('miSettings').addEventListener('click', () => { closeMenu(); openPage('settingsPage'); });
  $('miAbout').addEventListener('click', () => {
    closeMenu();
    $('aboutBody').innerHTML = ABOUT_HTML;
    openPage('aboutModal');
  });
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => {
    $(b.dataset.close).classList.add('hidden');
    if (b.dataset.close === 'settingsPage') renderReader(true);
    if (b.dataset.close === 'colorPickerModal' && cpState) {
      addRecentColor(effectiveColor(cpState.key));
      applyAll();
    }
  }));
  $('parshaName').addEventListener('click', () => { renderPicker(); openPage('pickerModal'); });
  $('parshaPrev').addEventListener('click', () => gotoParsha(pos.idx - 1, 0));
  $('parshaNext').addEventListener('click', () => gotoParsha(pos.idx + 1, 0));
  $('aliyahPrev').addEventListener('click', () => gotoAliyah(pos.aliyah - 1));
  $('aliyahNext').addEventListener('click', () => gotoAliyah(pos.aliyah + 1));
  $('aliyahName').addEventListener('click', () => {
    // cycle chooser: quick jump via numbered list
    const names = S.lang === 'he' ? ALIYAH_HE : ALIYAH_EN;
    const n = aliyahCount();
    const next = (pos.aliyah + 1) % n;
    gotoAliyah(next);
  });
  $('btnPlay').addEventListener('click', () => { scrolling ? stopAutoScroll() : startAutoScroll(); });
  $('zenPlayBtn').addEventListener('click', () => { scrolling ? stopAutoScroll() : startAutoScroll(); });
  $('speedUp').addEventListener('click', () => setSpeed(S.speed + 1));
  $('speedDown').addEventListener('click', () => setSpeed(S.speed - 1));
  $('btnBookmark').addEventListener('click', goToBookmark);
  $('btnZen').addEventListener('click', toggleZen);
  $('zenExit').addEventListener('click', toggleZen);
  $('zenMinimapToggle').addEventListener('click', () => {
    S.zenMinimapPinned = !S.zenMinimapPinned;
    saveSettings();
    $('zenMinimapToggle').classList.toggle('on', S.zenMinimapPinned);
    if (S.zenMinimapPinned) expandMinimap(false);
    else $('zenMinimap').classList.remove('expanded');
  });
  $('zenMinimapTrack').addEventListener('pointerdown', ev => {
    minimapDragging = true;
    try { $('zenMinimapTrack').setPointerCapture(ev.pointerId); } catch (e) {}
    expandMinimap(true);
    minimapScrubTo(ev.clientY);
  });
  $('zenMinimapTrack').addEventListener('pointermove', ev => {
    if (!minimapDragging) return;
    minimapScrubTo(ev.clientY);
  });
  window.addEventListener('pointerup', () => {
    if (!minimapDragging) return;
    minimapDragging = false;
    expandMinimap(true);
  });
  window.addEventListener('resize', () => syncMinimap(true));
  $('viewFilter').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    S.viewFilter = b.dataset.vf;
    saveSettings(); applyAll(); renderReader(true);
  }));
  // save scroll position (debounced)
  let scrollT = 0;
  $('content').addEventListener('scroll', () => {
    updateScrollProgress();
    syncMinimap();
    clearTimeout(scrollT);
    scrollT = setTimeout(() => {
      pos.scroll = $('content').scrollTop;
      savePos();
      const c = $('content');
      if (S.autoMark && !scrolling && c.scrollTop + c.clientHeight >= c.scrollHeight - 4 && c.scrollHeight > c.clientHeight * 1.5) {
        markAliyahDoneQuiet();
      }
    }, 300);
  });
  // dragging/scrolling the page by hand must NOT cancel auto-scroll; only
  // system-level interruptions (app backgrounded, notification shade opened) do.
  document.addEventListener('visibilitychange', () => { if (document.hidden && scrolling) stopAutoScroll(); });
  // double-tap toggles fullscreen (zen) mode, both entering and exiting
  $('content').addEventListener('dblclick', ev => { ev.preventDefault(); toggleZen(); });
  // long-press a verse to mark/unmark a bookmark on it
  $('content').addEventListener('touchstart', ev => {
    const v = ev.target.closest('.verse[data-cv]');
    if (!v) return;
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
      longPressTimer = null;
      const [c, vv] = v.dataset.cv.split(':').map(Number);
      toggleVerseBookmark(c, vv);
      if (navigator.vibrate) navigator.vibrate(25);
    }, 550);
  }, { passive: true });
  $('content').addEventListener('touchmove', () => clearTimeout(longPressTimer), { passive: true });
  $('content').addEventListener('touchend', () => clearTimeout(longPressTimer));
  $('content').addEventListener('touchcancel', () => clearTimeout(longPressTimer));
  $('miTeamim').addEventListener('click', () => {
    closeMenu();
    renderTeamimPage(teamimNusach);
    openPage('teamimPage');
  });
  $('segNusach').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    teamimNusach = b.dataset.val;
    renderTeamimPage(teamimNusach);
  }));
}

function goToBookmark() {
  if (!bookmarks.length) { toast(t('noBookmark')); return; }
  stopAutoScroll();
  const b = bookmarks[0];
  const cv = `${b.c}:${b.v}`;
  // already reading the bookmarked aliyah: jump straight to the verse, no re-render at all
  if (S.loc === b.loc && pos.idx === b.idx && pos.aliyah === b.aliyah) {
    const el = document.querySelector(`.verse[data-cv="${cv}"]`);
    if (el) { el.scrollIntoView({ block: 'center' }); pos.scroll = $('content').scrollTop; savePos(); }
    return;
  }
  S.loc = b.loc; saveSettings();
  pos.loc = b.loc; pos.idx = b.idx; pos.aliyah = b.aliyah;
  savePos();
  applyAll();
  renderReader(false, cv);
}

const ABOUT_HTML = `
<p><b>שניים מקרא ואחד תרגום</b> — אפליקציה חינמית, ללא פרסומות, לקריאת פרשת השבוע שניים מקרא ואחד תרגום. פועלת ללא אינטרנט.</p>
<p>מקורות הטקסט (באדיבות ספריא):</p>
<ul>
<li>מקרא: Tanach with Ta'amei Hamikra</li>
<li>תרגום אונקלוס: מהדורת מצודה (Metsudah, 2009)</li>
<li>רש"י: מהדורת זילברמן (1929)</li>
<li>לוח פרשות ועליות: hebcal</li>
</ul>
<p>גופנים: פרנק-רוהל וכתר (Culmus), עזרא (SIL OFL).</p>
<p>הטקסטים נבדקו אך ייתכנו טעויות — נא לדווח. אין לסמוך על האפליקציה לקריאה בציבור.</p>`;

// Unicode Hebrew cantillation (te'amim) combining marks, U+0591-U+05AA.
// Each name below is shown WITH its own actual mark applied to its first letter,
// so the reader can see what the trope symbol looks like.
const TAAM = {
  etnachta: '֑', segol: '֒', shalshelet: '֓', zakefKatan: '֔', zakefGadol: '֕',
  tipcha: '֖', revia: '֗', zarka: '֘', pashta: '֙', yetiv: '֚',
  tevir: '֛', geresh: '֜', gershayim: '֞', karneyPara: '֟',
  telishaGedola: '֠', pazer: '֡', munach: '֣', mahapakh: '֤',
  merkha: '֥', merkhaKefula: '֦', darga: '֧', kadma: '֨', telishaKetana: '֩',
  yerachBenYomo: '֪',
};
function taamWord(tok) {
  if (typeof tok !== 'object') return esc(tok);
  const mark = TAAM[tok[1]];
  const w = tok[0];
  return mark ? esc(w[0]) + mark + esc(w.slice(1)) : esc(w);
}
function teamimLine(tokens) {
  return tokens.map(taamWord).join(' ').replace(/ +([,.:])/g, '$1');
}

const SEPH_TEAMIM = {
  title: 'אֵלּוּ שְׁמוֹת הַטְּעָמִים (נוסח ספרד):',
  lines: [
    [['קַדְמָא', 'kadma'], ['מֻנַּח', 'munach'], ['זַרְקָא', 'zarka'], ['מֻנַּח', 'munach'], ['סְגּוֹל', 'segol'], ','],
    [['מֻנַּח', 'munach'], ['רְבִיעִי', 'revia'], ['מַהְפָּךְ', 'mahapakh'], ['פַּשְׁטָא', 'pashta'], ['זָקֵף', 'zakefKatan'], 'קָטָן', ','],
    [['וְזָקֵף', 'zakefGadol'], 'גָּדוֹל', ['מֵרְכָא', 'merkha'], ['טִפְחָא', 'tipcha'], ['מֻנַּח', 'munach'], ['אַתְנַחְתָּא', 'etnachta'], ','],
    [['פָּזֵר', 'pazer'], ['תְּלִישָׁא', 'telishaKetana'], 'קְטַנָּה', ['תְּלִישָׁא', 'telishaGedola'], 'גְדוֹלָה', ['קַדְמָא', 'kadma'], ['וְאַזְלָא', 'geresh'], ','],
    [['אַזְלָא', 'geresh'], ['גֵרֵשׁ', 'geresh'], ['גֵּרְשַׁיִם', 'gershayim'], ['דַּרְגָּא', 'darga'], ['תְּבִיר', 'tevir'], ['יְתִיב', 'yetiv'], ','],
    ['פָּסֵק׀', 'וְסוֹף', 'פָּסוּק׃'],
    [['שַׁלְשֶׁלֶת', 'shalshelet'], ['קַרְנֵי', 'karneyPara'], 'פָרָה', ['מֵרְכָא', 'merkhaKefula'], 'כְפוּלָה', ['יֶרַח', 'yerachBenYomo'], 'בֶּן', 'יוֹמוֹ', '.'],
  ],
  note: '(הערה: בחלק מסידורי הספרדים משנים מעט את הסדר בסוף: "שַׁלְשֶׁלֶת יֶרַח בֶּן יוֹמוֹ קַרְנֵי פָרָה מֵרְכָא כְפוּלָה").',
};

const ASHK_TEAMIM = {
  title: 'שְׁמוֹת הַטְּעָמִים לְמִנְהַג אַשְׁכְּנַז (פולין וליטא):',
  lines: [
    [['מֻנַּח', 'munach'], ['זַרְקָא', 'zarka'], ',', ['מֻנַּח', 'munach'], ['סְגּוֹל', 'segol'], '.'],
    [['מֻנַּח', 'munach'], ['רְבִיעִי', 'revia'], ',', ['מַהְפַּךְ', 'mahapakh'], ['פַּשְׁטָא', 'pashta'], ',', ['זָקֵף', 'zakefKatan'], 'קָטָן', ',', ['זָקֵף', 'zakefGadol'], 'גָּדוֹל', '.'],
    [['מֵרְכָא', 'merkha'], ['טִפְחָא', 'tipcha'], ',', ['מֻנַּח', 'munach'], ['אַתְנַחְתָּא', 'etnachta'], '.'],
    [['פָּזֵר', 'pazer'], ',', ['תְּלִישָׁא', 'telishaKetana'], 'קְטַנָּה', ',', ['תְּלִישָׁא', 'telishaGedola'], 'גְדוֹלָה', ',', ['קַדְמָא', 'kadma'], ['וְאַזְלָא', 'geresh'], ',', ['גֵּרֵשׁ', 'geresh'], ',', ['גֵּרְשַׁיִם', 'gershayim'], '.'],
    [['דַּרְגָּא', 'darga'], ['תְּבִיר', 'tevir'], ',', ['יְתִיב', 'yetiv'], ',', 'פָּסֵק׀.'],
    [['מֵרְכָא', 'merkha'], ['טִפְחָא', 'tipcha'], ',', ['מֻנַּח', 'munach'], 'סוֹף', 'פָּסוּק׃.'],
  ],
  rareTitle: 'הַטְּעָמִים הַנְּדִירִים (בסוף):',
  rareLines: [
    [['שַׁלְשֶׁלֶת', 'shalshelet'], ',', ['יֶרַח', 'yerachBenYomo'], 'בֶּן', 'יוֹמוֹ', ',', ['קַרְנֵי', 'karneyPara'], 'פָרָה', ',', ['מִירְכָא', 'merkhaKefula'], 'כְפוּלָה', '.'],
  ],
};

function renderTeamimPage(nusach) {
  seg($('segNusach'), nusach);
  const d = nusach === 'ashk' ? ASHK_TEAMIM : SEPH_TEAMIM;
  let h = `<h4>${esc(d.title)}</h4>`;
  h += d.lines.map(l => `<div class="teamimline">${teamimLine(l)}</div>`).join('');
  if (d.note) h += `<p class="hint">${esc(d.note)}</p>`;
  if (d.rareTitle) {
    h += `<h4>${esc(d.rareTitle)}</h4>`;
    h += d.rareLines.map(l => `<div class="teamimline">${teamimLine(l)}</div>`).join('');
  }
  $('teamimBody').innerHTML = h;
}

// ---------------------------------------------------------------- boot
async function boot() {
  [PARSHIYOT, SCHEDULE] = await Promise.all([fetchData('parshiyot.json'), fetchData('schedule.json')]);

  const cw = currentWeekIdx();
  if (!pos || pos.loc !== S.loc || typeof pos.idx !== 'number' || pos.idx >= sched().length) {
    pos = { loc: S.loc, idx: cw, aliyah: 0, scroll: 0 };
  } else if (S.autoAdvance === 'yes' && pos.week && pos.week < sched()[cw][0] && pos.idx < cw) {
    // moved past Shabbat -> jump to the new week's parsha
    pos = { loc: S.loc, idx: cw, aliyah: 0, scroll: 0 };
    setTimeout(() => toast(t('movedToWeek', { parsha: PARSHIYOT[sched()[cw][1]].he })), 600);
  }
  pos.aliyah = Math.min(pos.aliyah || 0, aliyahCount() - 1);
  savePos();

  bindUI();
  bindSettings();
  applyAll();
  applyKeepAwake();
  applyReminder();
  await renderReader(true);

  // let native know current parsha (for reminder text)
  const n = native();
  if (n && n.setCurrentParsha) {
    try { n.setCurrentParsha(PARSHIYOT[sched()[cw][1]].he); } catch (e) {}
  }
}

boot().catch(e => {
  $('content').innerHTML = `<div class="endnote">שגיאה בטעינה: ${esc(String(e))}</div>`;
});
