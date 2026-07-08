/* שניים מקרא ואחד תרגום — offline reader.
 * Data: Sefaria (Tanach with Ta'amei Hamikra / Metsudah Onkelos / Silbermann Rashi),
 * schedule + aliyot via @hebcal (precomputed into data/*.json).
 */
'use strict';

// ---------------------------------------------------------------- constants
const ALIYAH_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי', 'הפטרה'];
const ALIYAH_EN = ['Rishon', 'Sheni', 'Shlishi', "Revi'i", 'Chamishi', 'Shishi', "Shvi'i", 'Haftarah'];
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
    progress: 'התקדמות', chooseParsha: 'בחר פרשה', close: 'סגור',
    menuToday: 'לפרשת השבוע', menuProgress: 'התקדמות', menuBookmark: 'עבור לסימניה',
    menuFontUp: 'הגדל כתב', menuFontDown: 'הקטן כתב', menuSettings: 'הגדרות', menuAbout: 'אודות',
    autoScroll: 'גלילה אוטומטית:', speed: 'מהירות:',
    all: 'הכל', mikraOnly: 'מקרא', targumOnly: 'תרגום',
    mikraFirst: 'מקרא — פעם ראשונה', mikraSecond: 'מקרא — פעם שנייה', mikraOnce: 'מקרא',
    onkelosSec: 'תרגום אונקלוס', rashiSec: 'רש"י',
    doneAliyah: 'סיימתי עלייה זו ✓', doneHaftara: 'סיימתי את ההפטרה ✓', aliyahDoneAlready: 'הושלם ✓',
    parshaDone: 'סיימת את כל הפרשה! 🎉', bookmarkSaved: 'הסימניה נשמרה',
    noBookmark: 'אין סימניה שמורה', chapter: 'פרק',
    todayRead: 'היום ({day}): עלייה {aliyah}', go: 'עבור',
    streak: 'רצף שבועות', doneParshiot: 'פרשות שהושלמו', versesLeft: 'פסוקים שנותרו השבוע',
    thisWeek: 'פרשת השבוע', history: 'שבועות אחרונים',
    stFull: 'הושלם', stPart: 'חלקי', stNone: '—',
    haftaraIn: 'הפטרה ב{book}', minhagNote: 'מנהג {minhag}',
    loading: 'טוען…', movedToWeek: 'עברנו לפרשת השבוע: {parsha}',
    reminderSet: 'התזכורת נקבעה', reminderOff: 'התזכורת בוטלה',
    endOfAliyah: 'סוף עלייה', notifNA: 'התראות זמינות רק באפליקציה',
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
    progress: 'Progress', chooseParsha: 'Choose parashah', close: 'Close',
    menuToday: 'This week\'s parashah', menuProgress: 'Progress', menuBookmark: 'Go to bookmark',
    menuFontUp: 'Increase font', menuFontDown: 'Decrease font', menuSettings: 'Settings', menuAbout: 'About',
    autoScroll: 'Auto-scroll:', speed: 'Speed:',
    all: 'All', mikraOnly: 'Mikra', targumOnly: 'Targum',
    mikraFirst: 'Mikra — first reading', mikraSecond: 'Mikra — second reading', mikraOnce: 'Mikra',
    onkelosSec: 'Targum Onkelos', rashiSec: 'Rashi',
    doneAliyah: 'Finished this aliyah ✓', doneHaftara: 'Finished the haftarah ✓', aliyahDoneAlready: 'Completed ✓',
    parshaDone: 'You finished the whole parashah! 🎉', bookmarkSaved: 'Bookmark saved',
    noBookmark: 'No saved bookmark', chapter: 'Chapter',
    todayRead: 'Today ({day}): aliyah {aliyah}', go: 'Go',
    streak: 'Week streak', doneParshiot: 'Parshiot completed', versesLeft: 'Verses left this week',
    thisWeek: 'This week\'s parashah', history: 'Recent weeks',
    stFull: 'Done', stPart: 'Partial', stNone: '—',
    haftaraIn: 'Haftarah in {book}', minhagNote: '{minhag} custom',
    loading: 'Loading…', movedToWeek: 'Moved to this week\'s parashah: {parsha}',
    reminderSet: 'Reminder set', reminderOff: 'Reminder cancelled',
    endOfAliyah: 'End of aliyah', notifNA: 'Notifications are available only in the app',
  },
};

const DEFAULTS = {
  onkelos: true, rashi: false, fontSize: 54, speed: 55, mode: 'pasuk',
  teamim: 'with', haftara: 'with', minhag: 'seph', twice: 'twice', lang: 'he',
  colors: {}, theme: 'light', loc: 'il',
  reminderOn: false, reminderDay: 4, reminderTime: '20:00',
  font: 'frank', scrollbar: 'yes', autoAdvance: 'yes',
  dailyPlan: false, keepAwake: false, autoMark: true, viewFilter: 'all',
};

// ---------------------------------------------------------------- state
let S = loadJSON('sm_settings', {});
S = Object.assign({}, DEFAULTS, S);
let PARSHIYOT = null, SCHEDULE = null, HAFTAROT = null;
const bookCache = {};
let pos = loadJSON('sm_pos', null);       // {loc, idx, aliyah, scroll}
let progress = loadJSON('sm_prog', {});   // "date|key" -> {a:[bool x8]}
let bookmark = loadJSON('sm_bookmark', null);
let scrolling = false, scrollRAF = 0, lastTs = 0, scrollRemainder = 0;
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
  let h = `<div class="verse" data-cv="${vd.c}:${vd.v}">`;
  h += `<span class="vnum">${gematria(vd.v)}</span>`;
  const parts = [];
  if (showMikra) {
    parts.push(mikraHTML(vd, 'mikra'));
    if (S.twice === 'twice') parts.push(mikraHTML(vd, 'mikra2'));
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
    passes.push({ head: S.twice === 'twice' ? t('mikraFirst') : t('mikraOnce'), type: 'm1' });
    if (S.twice === 'twice') passes.push({ head: t('mikraSecond'), type: 'm2' });
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
      if (pass.type === 'm1' || pass.type === 'm2') {
        h += `<div class="verse"><span class="vnum">${gematria(vd.v)}</span>${mikraHTML(vd, pass.type === 'm1' ? 'mikra' : 'mikra2')}</div>`;
      } else if (pass.type === 't') {
        if (vd.t) h += `<div class="verse"><span class="vnum">${gematria(vd.v)}</span><span class="targum">${esc(vd.t)}</span></div>`;
      } else {
        h += `<div class="verse"><span class="vnum">${gematria(vd.v)}</span></div><div class="rashi">${vd.r.map(sanitizeRashi).join('<br>')}</div>`;
      }
    }
  }
  return h;
}

async function renderReader(keepScroll) {
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
  }

  // end-of-aliyah button
  const done = progOf(e).a[pos.aliyah];
  html += `<button class="aliyahDone${done ? ' done' : ''}" id="btnAliyahDone">${
    done ? t('aliyahDoneAlready') : (pos.aliyah === 7 ? t('doneHaftara') : t('doneAliyah'))}</button>`;
  html += `<div class="endnote">${t('endOfAliyah')} · ${m.he}</div>`;

  content.innerHTML = html;
  $('btnAliyahDone').addEventListener('click', onAliyahDone);
  content.scrollTop = keepScroll ? (pos.scroll || 0) : 0;
  if (!keepScroll) { pos.scroll = 0; savePos(); }
  updateProgressChip();
  updateNavButtons();
}

function updateProgressChip() {
  const p = progOf(entry());
  const n = aliyahCount();
  let done = 0;
  for (let i = 0; i < n; i++) if (p.a[i]) done++;
  $('progressChip').textContent = Math.round(done / n * 100) + '%';
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

// ---------------------------------------------------------------- auto scroll
function pxPerSec() { return 6 + S.speed * 1.8; }
function startAutoScroll() {
  scrolling = true;
  $('btnPlay').textContent = '❚❚';
  $('btnPlay').classList.add('playing');
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
          if (S.autoMark) onAliyahDone();
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
  scrolling = false;
  cancelAnimationFrame(scrollRAF);
  const b = $('btnPlay');
  if (b) { b.textContent = '▶'; b.classList.remove('playing'); }
}
function setSpeed(v) {
  S.speed = Math.max(1, Math.min(100, v));
  $('speedVal').textContent = S.speed;
  $('speedVal2').textContent = S.speed;
  saveSettings();
}

// ---------------------------------------------------------------- progress page
function renderProgress() {
  const body = $('progressBody');
  const e = entry();
  const m = meta();
  const p = progOf(e);
  const n = aliyahCount();
  const names = S.lang === 'he' ? ALIYAH_HE : ALIYAH_EN;

  let cells = '';
  for (let i = 0; i < n; i++) {
    cells += `<button class="alcell${p.a[i] ? ' done' : ''}" data-al="${i}">${names[i]}${p.a[i] ? ' ✓' : ''}</button>`;
  }

  // streak: consecutive fully-read weeks before (and including) current week
  const cw = currentWeekIdx();
  let streak = 0;
  const arr = sched();
  const cwDone = fullyDone(arr[cw]);
  for (let i = cw - (cwDone ? 0 : 1); i >= 0; i--) {
    if (fullyDone(arr[i])) streak++;
    else break;
  }
  let total = 0;
  for (const k of Object.keys(progress)) {
    const [date, key] = k.split('|');
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
    <div class="progparsha">
      <h3>${m.he}</h3>
      <div class="progdate">${t('thisWeek')} · ${fmtDate(e[0])}</div>
      <div class="aliyagrid">${cells}</div>
    </div>
    <div class="progstats">
      <div class="statbox"><div class="n">${streak}</div><div class="l">${t('streak')}</div></div>
      <div class="statbox"><div class="n">${total}</div><div class="l">${t('doneParshiot')}</div></div>
      <div class="statbox"><div class="n" id="versesLeftN">…</div><div class="l">${t('versesLeft')}</div></div>
    </div>
    <div class="progparsha"><h3>${t('history')}</h3></div>
    ${hist}`;

  body.querySelectorAll('.alcell').forEach(c => c.addEventListener('click', () => {
    const i = +c.dataset.al;
    p.a[i] = !p.a[i];
    saveProgress();
    renderProgress();
    updateProgressChip();
  }));

  // verses left (async: needs book)
  loadBook(m.book).then(bd => {
    let left = 0;
    for (let i = 0; i < 7; i++) if (!p.a[i]) left += versesForRange(bd, m.aliyot[i]).length;
    const el = $('versesLeftN');
    if (el) el.textContent = left;
  }).catch(() => {});
}
function fullyDone(e) {
  const pr = progress[progKey(e)];
  return !!pr && pr.a.slice(0, 7).every(Boolean);
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

function applyAll() {
  // theme, font, colors, font size, i18n, bars
  document.documentElement.setAttribute('data-theme', S.theme);
  document.body.setAttribute('data-font', S.font);
  document.documentElement.setAttribute('lang', S.lang);
  document.documentElement.setAttribute('dir', 'rtl'); // app is RTL even in English UI
  $('content').style.fontSize = S.fontSize + 'px';
  const root = document.documentElement.style;
  if (S.colors.targum) root.setProperty('--targum', S.colors.targum); else root.removeProperty('--targum');
  if (S.colors.rashi) root.setProperty('--rashi', S.colors.rashi); else root.removeProperty('--rashi');
  if (S.colors.mikra) { root.setProperty('--mikra', S.colors.mikra); } else root.removeProperty('--mikra');
  $('scrollbar').classList.toggle('hidden', S.scrollbar !== 'yes');
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $('fontVal').textContent = S.fontSize;
  $('speedVal').textContent = S.speed;
  $('speedVal2').textContent = S.speed;
  seg($('segMode'), S.mode); seg($('segTeamim'), S.teamim); seg($('segHaftara'), S.haftara);
  seg($('segMinhag'), S.minhag); seg($('segTwice'), S.twice); seg($('segLang'), S.lang);
  seg($('segTheme'), S.theme); seg($('segLoc'), S.loc); seg($('segScrollbar'), S.scrollbar);
  seg($('segAutoAdvance'), S.autoAdvance);
  $('setOnkelos').checked = S.onkelos;
  $('setRashi').checked = S.rashi;
  $('setDailyPlan').checked = S.dailyPlan;
  $('setKeepAwake').checked = S.keepAwake;
  $('setAutoMark').checked = S.autoMark;
  $('setReminder').checked = S.reminderOn;
  $('remDay').value = String(S.reminderDay);
  $('remTime').value = S.reminderTime;
  $('reminderRow').style.display = S.reminderOn ? '' : 'none';
  const radio = document.querySelector(`input[name=font][value=${S.font}]`);
  if (radio) radio.checked = true;
  const getVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  $('colOnkelos').value = S.colors.targum || rgbToHex(getVar('--targum')) || '#275079';
  $('colRashi').value = S.colors.rashi || rgbToHex(getVar('--rashi')) || '#6a4a1f';
  $('colMikra').value = S.colors.mikra || rgbToHex(getVar('--mikra')) || '#16161a';
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
  $('setDailyPlan').addEventListener('change', ev => { S.dailyPlan = ev.target.checked; saveSettings(); renderDayBanner(); });
  $('setKeepAwake').addEventListener('change', ev => { S.keepAwake = ev.target.checked; saveSettings(); applyKeepAwake(); });
  $('setAutoMark').addEventListener('change', ev => { S.autoMark = ev.target.checked; saveSettings(); });
  document.querySelectorAll('input[name=font]').forEach(r => r.addEventListener('change', ev => {
    S.font = ev.target.value; saveSettings(); applyAll();
  }));
  $('colOnkelos').addEventListener('input', ev => { S.colors.targum = ev.target.value; saveSettings(); applyAll(); });
  $('colRashi').addEventListener('input', ev => { S.colors.rashi = ev.target.value; saveSettings(); applyAll(); });
  $('colMikra').addEventListener('input', ev => { S.colors.mikra = ev.target.value; saveSettings(); applyAll(); });
  $('btnResetColors').addEventListener('click', () => { S.colors = {}; saveSettings(); applyAll(); });
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

function bindUI() {
  $('btnMenu').addEventListener('click', () => {
    $('sideMenu').classList.remove('hidden');
    $('menuOverlay').classList.remove('hidden');
  });
  $('menuOverlay').addEventListener('click', closeMenu);
  $('miToday').addEventListener('click', () => { closeMenu(); gotoParsha(currentWeekIdx(), 0); });
  $('miProgress').addEventListener('click', () => { closeMenu(); renderProgress(); openPage('progressPage'); });
  $('miBookmarkGo').addEventListener('click', () => {
    closeMenu();
    if (!bookmark || bookmark.loc !== S.loc) { toast(t('noBookmark')); return; }
    pos.idx = bookmark.idx; pos.aliyah = bookmark.aliyah; pos.scroll = bookmark.scroll; pos.loc = S.loc;
    savePos();
    renderReader(true);
  });
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
  $('speedUp').addEventListener('click', () => setSpeed(S.speed + 1));
  $('speedDown').addEventListener('click', () => setSpeed(S.speed - 1));
  $('btnBookmark').addEventListener('click', () => {
    bookmark = { loc: S.loc, idx: pos.idx, aliyah: pos.aliyah, scroll: $('content').scrollTop };
    saveJSON('sm_bookmark', bookmark);
    toast(t('bookmarkSaved'));
  });
  $('btnZen').addEventListener('click', () => {
    document.body.classList.add('zen');
    $('zenExit').classList.remove('hidden');
    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
  });
  $('zenExit').addEventListener('click', () => {
    document.body.classList.remove('zen');
    $('zenExit').classList.add('hidden');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  });
  $('viewFilter').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    S.viewFilter = b.dataset.vf;
    saveSettings(); applyAll(); renderReader(true);
  }));
  // save scroll position (debounced)
  let scrollT = 0;
  $('content').addEventListener('scroll', () => {
    clearTimeout(scrollT);
    scrollT = setTimeout(() => {
      pos.scroll = $('content').scrollTop;
      savePos();
      const c = $('content');
      if (S.autoMark && !scrolling && c.scrollTop + c.clientHeight >= c.scrollHeight - 4 && c.scrollHeight > c.clientHeight * 1.5) {
        const p = progOf(entry());
        if (!p.a[pos.aliyah]) {
          p.a[pos.aliyah] = true;
          saveProgress();
          updateProgressChip();
          const btn = $('btnAliyahDone');
          if (btn) { btn.classList.add('done'); btn.textContent = t('aliyahDoneAlready'); }
        }
      }
    }, 300);
  });
  // stop auto-scroll on user touch-drag
  $('content').addEventListener('touchstart', () => { if (scrolling) stopAutoScroll(); }, { passive: true });
  $('content').addEventListener('wheel', () => { if (scrolling) stopAutoScroll(); }, { passive: true });
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
