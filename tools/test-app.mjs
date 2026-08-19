// End-to-end tests for the Shnayim Mikra web app.
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:8777/index.html';
const SHOTS = new URL('./shots', import.meta.url).pathname;
import fs from 'fs';
fs.mkdirSync(SHOTS, { recursive: true });

let passed = 0, failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; console.log('  ✓', name); }
  else { failed++; console.log('  ✗ FAIL:', name, extra !== undefined ? JSON.stringify(extra).slice(0, 300) : ''); }
}

const TAAMIM = /[֑-֮]/;
const strip = s => s.replace(/[\u0591-\u05C7]/g, '');

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 412, height: 915 } }); // Pixel-ish
page.on('console', msg => { if (msg.type() === 'error') console.log('  [console error]', msg.text()); });
page.on('pageerror', e => { failed++; console.log('  ✗ PAGE ERROR:', e.message); });

// Freeze "today" at 2026-07-07 (Tuesday); this week's parsha = Matot-Masei (11 Jul 2026)
await page.addInitScript(() => {
  const RealDate = Date;
  const FIXED = new RealDate(2026, 6, 7, 15, 50, 0);
  // eslint-disable-next-line no-global-assign
  Date = class extends RealDate {
    constructor(...args) { if (args.length === 0) { super(FIXED.getTime()); } else { super(...args); } }
    static now() { return FIXED.getTime(); }
  };
});

console.log('== 1. boot / current week ==');
await page.goto(BASE);
await page.waitForSelector('.verse', { timeout: 15000 });
const parshaName = await page.textContent('#parshaName');
check('current parsha is Matot-Masei', parshaName.includes('מַטּוֹת'), parshaName);
const aliyahName = await page.textContent('#aliyahName');
check('starts at rishon', aliyahName.trim() === 'ראשון', aliyahName);
const firstVerse = await page.textContent('.verse');
check('first verse is Numbers 30:2 (vayedaber Moshe)', strip(firstVerse).includes('וידבר משה אלראשי המטות'), firstVerse.slice(0, 80));
const chapHead = await page.textContent('.chapterhead');
check('chapter heading shown', chapHead.includes('פרק ל'), chapHead);
// default: verse twice + onkelos
const v1 = await page.$eval('.verse', el => ({
  mikra: el.querySelectorAll('.mikra').length,
  mikra2: el.querySelectorAll('.mikra2').length,
  targum: el.querySelectorAll('.targum').length,
}));
check('verse shown twice by default', v1.mikra === 1 && v1.mikra2 === 1, v1);
check('onkelos shown by default', v1.targum === 1, v1);
const targumText = await page.$eval('.verse .targum', el => el.textContent);
check('targum is aramaic (Onkelos)', strip(targumText).includes('ומליל משה עם רישי שבטיא'), targumText.slice(0, 60));
check('no rashi by default', (await page.$$('.rashi')).length === 0);
await page.screenshot({ path: SHOTS + '/01-reader.png' });

console.log('== 2. settings: rashi, teamim, once, aliyah-mode ==');
await page.click('#btnMenu');
await page.click('#miSettings');
await page.screenshot({ path: SHOTS + '/02-settings.png' });
await page.click('#setRashi');
await page.click('.pageback');
await page.waitForSelector('.rashi');
check('rashi appears after enabling', (await page.$$('.rashi')).length > 0);

await page.click('#btnMenu'); await page.click('#miSettings');
await page.click('#segTeamim [data-val=without]');
await page.click('.pageback');
await page.waitForSelector('.verse .mikra');
const noTaamim = await page.$eval('.verse .mikra', el => el.textContent);
check('teamim stripped', !TAAMIM.test(noTaamim), noTaamim.slice(0, 60));
check('nikud kept', /[ְ-ּ]/.test(noTaamim), noTaamim.slice(0, 60));

await page.click('#btnMenu'); await page.click('#miSettings');
await page.click('#segTwice [data-val=once]');
await page.click('.pageback');
const v2 = await page.$eval('.verse', el => ({ m2: el.querySelectorAll('.mikra2').length }));
check('verse shown once', v2.m2 === 0, v2);

await page.click('#btnMenu'); await page.click('#miSettings');
await page.click('#segMode [data-val=aliyah]');
await page.click('.pageback');
await page.waitForSelector('.sectionhead');
const heads = await page.$$eval('.sectionhead', els => els.map(e => e.textContent));
check('aliyah mode sections (mikra once + onkelos + rashi)', heads.length === 3 && heads[0] === 'מקרא' && heads[1].includes('אונקלוס') && heads[2].includes('רש'), heads);
await page.screenshot({ path: SHOTS + '/03-aliyah-mode.png' });

// restore: twice + pasuk mode + teamim
await page.click('#btnMenu'); await page.click('#miSettings');
await page.click('#segTwice [data-val=twice]');
await page.click('#segMode [data-val=pasuk]');
await page.click('#segTeamim [data-val=with]');
await page.click('#setRashi'); // off
await page.click('.pageback');

console.log('== 3. aliyah navigation + haftara ==');
// the haftara is off by default, so an 8th aliyah only exists once it's switched on
await page.click('#btnMenu'); await page.click('#miSettings');
await page.click('#segHaftara [data-val=with]');
await page.click('.pageback');
await page.waitForSelector('.verse');
// go to haftara via next-arrows: 7 times (rishon..haftara)
for (let i = 0; i < 7; i++) await page.click('#aliyahNext');
await page.waitForFunction(() => document.getElementById('aliyahName').textContent.trim() === 'הפטרה');
await page.waitForSelector('.haftNote');
const haftNote = await page.textContent('.haftNote');
check('haftara sephard by default', haftNote.includes('ספרד') && haftNote.includes('Jeremiah'), haftNote);
const haftBook = await page.textContent('.chapterhead');
check('haftara book Jeremiah', haftBook.includes('ירמיהו'), haftBook);
const haftVerse = await page.textContent('.verse');
check('haftara first verse (Jer 2:4)', strip(haftVerse).includes('שמעו דבריהוה בית יעקב'), haftVerse.slice(0, 60));
await page.screenshot({ path: SHOTS + '/04-haftara.png' });
// ashkenaz minhag
await page.click('#btnMenu'); await page.click('#miSettings');
await page.click('#segMinhag [data-val=ashk]');
await page.click('.pageback');
await page.waitForSelector('.haftNote');
const haftNote2 = await page.textContent('.haftNote');
check('minhag switch to ashkenaz', haftNote2.includes('אשכנז'), haftNote2);
// next from haftara -> next parsha
await page.click('#aliyahNext');
await page.waitForFunction(() => document.getElementById('parshaName').textContent.includes('דְּבָרִים'));
check('next after haftara -> Devarim', true);
// back off again: the rest of the suite expects the default 7-aliyah week
await page.click('#btnMenu'); await page.click('#miSettings');
await page.click('#segHaftara [data-val=without]');
await page.click('.pageback');
await page.waitForSelector('.verse');
// back to current week via menu
await page.click('#btnMenu'); await page.click('#miToday');
await page.waitForFunction(() => document.getElementById('parshaName').textContent.includes('מַטּוֹת'));
check('menu: back to this week', true);

console.log('== 4. parsha navigation + picker ==');
await page.click('#parshaPrev');
await page.waitForFunction(() => document.getElementById('parshaName').textContent.includes('פִּינְחָס'));
check('prev parsha is Pinchas', true);
await page.click('#parshaName');
await page.waitForSelector('.pickrow.current');
const pickerHasDates = await page.$eval('.pickrow .pd', el => /\d\d\.\d\d\.\d\d/.test(el.textContent));
check('picker shows dates', pickerHasDates);
await page.click('[data-close=pickerModal]');
await page.click('#btnMenu'); await page.click('#miToday');
await page.waitForFunction(() => document.getElementById('parshaName').textContent.includes('מַטּוֹת'));

console.log('== 5. progress: done button, chip, weekly progress page ==');
let chip = await page.textContent('#progressChip');
check('chip starts 0%', chip === '0%', chip);
await page.$eval('#btnAliyahDone', el => el.scrollIntoView());
await page.click('#btnAliyahDone');
await page.waitForFunction(() => document.getElementById('aliyahName').textContent.trim() === 'שני');
check('done -> advances to sheni', true);
await page.waitForTimeout(300); // chip % is now computed async from real verse counts
chip = await page.textContent('#progressChip');
check('chip ~11% after rishon done (28/244 verses, not a flat 1/7)', chip === '11%', chip);
await page.click('#btnMenu'); await page.click('#miProgress');
await page.waitForSelector('.alrow');
const rows = await page.$$eval('.alrow', els => els.map(e => ({ txt: e.textContent, done: e.classList.contains('done') })));
check('7 aliyah rows (haftara setting is off), rishon done', rows.length === 7 && rows[0].done && !rows[1].done, rows.map(c => c.done));
check('weekly progress page has an overall ring, no Gregorian date', await page.$('#progRingPct') !== null && !/\d\d\.\d\d\.\d\d/.test(await page.textContent('#progressBody')));
// toggle sheni via row click
await page.click('.alrow[data-al="1"]');
await page.waitForTimeout(300);
const vl = parseInt(await page.textContent('#versesLeftN'), 10);
check('verses-left computed (Matot-Masei total 244, minus rishon 28 & sheni 42 = 174)', vl === 174, vl);

// --- reading-time estimates (200 words/min) + graphic parasha-size indicator ---
await page.waitForFunction(() => /\d/.test(document.getElementById('parashaTimeLeft').textContent));
const alTimes = await page.$$eval('.alrowtime', els => els.map(e => e.textContent.trim()));
check('every aliyah row shows a reading-time estimate', alTimes.length === 7 && alTimes.every(s => /^⏱ .*\d/.test(s)), alTimes);
const parashaLeft = await page.textContent('#parashaTimeLeft');
check('parasha time-left shown, and less than the whole parasha (rishon+sheni done)',
  /נותר לפרשה/.test(parashaLeft) && /\d/.test(parashaLeft), parashaLeft);
check('reading-speed source credited on the progress page',
  /200/.test(await page.textContent('.progWpmNote')) && /חפץ חיים/.test(await page.textContent('.progWpmNote')));
const gauge = await page.evaluate(() => ({
  fillPct: document.getElementById('sizeGaugeFill').style.width,
  markLeft: document.getElementById('sizeGaugeMark').style.left,
  note: document.getElementById('sizeGaugeNote').textContent,
  min: document.getElementById('sizeGaugeMin').textContent,
  max: document.getElementById('sizeGaugeMax').textContent,
  cls: document.getElementById('sizeGaugeFill').className,
}));
// Matot-Masei is a doubled parasha => the longest of them all, so the marker sits at the far end
check('size gauge places Matot-Masei at the long end', parseFloat(gauge.markLeft) === 100, gauge);
check('size gauge is colour-coded by tercile', gauge.cls.includes('long'), gauge.cls);
check('size gauge labels the shortest/longest parasha', /\d/.test(gauge.min) && /244/.test(gauge.max), gauge);
check('size gauge notes the percentile', /244/.test(gauge.note) && /%/.test(gauge.note), gauge.note);
await page.screenshot({ path: SHOTS + '/05-progress.png' });
await page.click('#progressPage .pageback');

console.log('== 5b. general progress page (streak/history moved out of the weekly view) ==');
await page.click('#btnMenu'); await page.click('#miProgressGeneral');
await page.waitForSelector('.progstats');
const streak = await page.$eval('.progstats .statbox .n', el => el.textContent);
check('streak box renders', /^\d+$/.test(streak), streak);
check('general page has no per-aliyah rows', await page.$('#progressGeneralBody .alrow') === null);
await page.click('#progressGeneralPage .pageback');

console.log('== 6. auto-scroll ==');
const st0 = await page.$eval('#content', el => el.scrollTop);
await page.click('#btnPlay');
await page.waitForTimeout(1500);
const st1 = await page.$eval('#content', el => el.scrollTop);
check('auto-scroll moves content', st1 > st0 + 20, { st0, st1 });
const playing = await page.$eval('#btnPlay', el => el.classList.contains('playing'));
check('play button in playing state', playing);
await page.click('#btnPlay');
await page.waitForTimeout(300);
const st2 = await page.$eval('#content', el => el.scrollTop);
await page.waitForTimeout(500);
const st3 = await page.$eval('#content', el => el.scrollTop);
check('pause stops scrolling', Math.abs(st3 - st2) < 2, { st2, st3 });
// speed +
const sp0 = await page.textContent('#speedVal');
await page.click('#speedUp');
check('speed increments', +(await page.textContent('#speedVal')) === +sp0 + 1);

console.log('== 6b. time-left chip (estimate while reading, live while auto-scrolling) ==');
await page.$eval('#content', el => el.scrollTop = 0);
await page.waitForTimeout(400);
const tc0 = await page.textContent('#timeChip');
check('chip shows a words-per-minute estimate for the aliyah', /^⏱ .*\d/.test(tc0), tc0);
const mins0 = parseInt(tc0.replace(/\D+/g, ''), 10);
await page.$eval('#content', el => el.scrollTop = Math.round(el.scrollHeight * 0.6));
await page.waitForTimeout(500);
const tc1 = await page.textContent('#timeChip');
check('estimate shrinks as you read down the aliyah', parseInt(tc1.replace(/\D+/g, ''), 10) < mins0, { tc0, tc1 });
await page.$eval('#content', el => el.scrollTop = 0);
await page.waitForTimeout(400);
await page.click('#btnPlay');
await page.waitForTimeout(900);
const live0 = await page.textContent('#timeChip');
check('auto-scroll switches the chip to a live countdown', /^▶ \d+:\d\d/.test(live0), live0);
check('live chip is styled as live', await page.$eval('#timeChip', el => el.classList.contains('live')));
const secsOf = s => { const [m, sec] = s.replace(/[^\d:]/g, '').split(':').map(Number); return m * 60 + sec; };
await page.waitForTimeout(2000);
const live1 = await page.textContent('#timeChip');
check('the countdown actually counts down', secsOf(live1) < secsOf(live0), { live0, live1 });
// a faster scroll means less time left
await page.click('#speedUp'); await page.click('#speedUp'); await page.click('#speedUp');
await page.waitForTimeout(200);
const fast = await page.textContent('#timeChip');
check('raising the scroll speed shortens the countdown', secsOf(fast) < secsOf(live1), { live1, fast });
await page.click('#btnPlay');
await page.waitForTimeout(300);
check('pausing goes back to the reading estimate', /^⏱/.test(await page.textContent('#timeChip')));
await page.click('#speedDown'); await page.click('#speedDown'); await page.click('#speedDown');

console.log('== 7. colors / theme / font / filters ==');
await page.click('#btnMenu'); await page.click('#miSettings');
// custom color picker (replaces the old native <input type=color>)
await page.click('#colOnkelos');
await page.waitForSelector('#colorPickerModal:not(.hidden)');
await page.fill('#cpHex', '#cc0000');
await page.dispatchEvent('#cpHex', 'change');
await page.click('[data-close=colorPickerModal]');
const swatchBg = await page.$eval('#colOnkelos', el => getComputedStyle(el).backgroundColor);
check('color picker swatch shows chosen color', swatchBg === 'rgb(204, 0, 0)', swatchBg);
await page.click('.pageback');
const tCol = await page.$eval('.verse .targum', el => getComputedStyle(el).color);
check('onkelos custom color applied', tCol === 'rgb(204, 0, 0)', tCol);
// recent colors: the color just picked should now appear in the swatch row
await page.click('#btnMenu'); await page.click('#miSettings');
await page.click('#colOnkelos');
await page.waitForSelector('#colorPickerModal:not(.hidden)');
const recentHexes = await page.$$eval('.cpRecentSwatch', els => els.map(e => e.dataset.hex.toLowerCase()));
check('recent colors remembers last pick', recentHexes.includes('#cc0000'), recentHexes);
await page.click('[data-close=colorPickerModal]');
await page.click('.pageback');

await page.click('#btnMenu'); await page.click('#miSettings');
await page.click('#segTheme [data-val=dark]');
const darkBg = await page.$eval('body', el => getComputedStyle(el).backgroundColor);
check('dark theme applied', darkBg === 'rgb(16, 17, 22)', darkBg);
// the light-theme custom onkelos color must NOT leak into dark theme (this used to make
// mikra2/targum invisible if a dark color was picked while in light mode)
const tColDark = await page.$eval('.verse .targum', el => getComputedStyle(el).color);
check('custom light-theme color does not leak into dark theme', tColDark !== 'rgb(204, 0, 0)', tColDark);
await page.screenshot({ path: SHOTS + '/06-settings-dark.png' });
await page.click('#segTheme [data-val=light]');
const tColBack = await page.$eval('.verse .targum', el => getComputedStyle(el).color);
check('light-theme custom color still applied after switching back', tColBack === 'rgb(204, 0, 0)', tColBack);
await page.click('#btnResetColors');
const tCol2 = await page.$eval('.verse .targum', el => getComputedStyle(el).color);
check('original colors restored', tCol2 !== 'rgb(204, 0, 0)', tCol2);
await page.check('input[name=font][value=ezra]');
await page.click('.pageback');
const fontFam = await page.$eval('#content', el => getComputedStyle(el).fontFamily);
check('ezra font applied', fontFam.includes('EzraSIL'), fontFam);

// view filter: targum only
await page.click('#viewFilter [data-vf=targum]');
await page.waitForFunction(() => !document.querySelector('.verse .mikra'));
const hasTargum = await page.$('.verse .targum');
check('targum-only filter', !!hasTargum);
await page.click('#viewFilter [data-vf=mikra]');
await page.waitForFunction(() => !document.querySelector('.verse .targum'));
check('mikra-only filter', !!(await page.$('.verse .mikra')));
await page.click('#viewFilter [data-vf=all]');
await page.waitForSelector('.verse .targum');

console.log('== 8. font size + persistence across reload ==');
await page.click('#btnMenu'); await page.click('#miSettings');
const f0 = +(await page.textContent('#fontVal'));
await page.click('#fontUp'); await page.click('#fontUp');
check('font stepper', +(await page.textContent('#fontVal')) === f0 + 4);
await page.click('.pageback');
const fs1 = await page.$eval('#content', el => el.style.fontSize);
check('font size applied to content', fs1 === (f0 + 4) + 'px', fs1);
// bookmark — a bookmark is placed by long-pressing a verse; the toolbar 🔖 button only
// *jumps* to the saved one
await page.$eval('#content', el => el.scrollTop = 1500);
await page.waitForTimeout(400);
const bmCV = await page.evaluate(() => {
  const c = document.getElementById('content');
  const vs = [...c.querySelectorAll('.verse[data-cv]')];
  const el = vs.find(v => v.offsetTop >= c.scrollTop) || vs[vs.length - 1];
  return el.dataset.cv;
});
await page.dispatchEvent(`.verse[data-cv="${bmCV}"]`, 'touchstart');
await page.waitForSelector('.verse.bookmarked', { timeout: 5000 });
check('long-press places a bookmark', true);
// navigate away then reload
await page.click('#parshaPrev');
await page.waitForFunction(() => document.getElementById('parshaName').textContent.includes('פִּינְחָס'));
await page.reload();
await page.waitForSelector('.verse');
check('position persists after reload (Pinchas)', (await page.textContent('#parshaName')).includes('פִּינְחָס'));
check('font size persists', (await page.$eval('#content', el => el.style.fontSize)) === (f0 + 4) + 'px');
check('font family persists', (await page.$eval('#content', el => getComputedStyle(el).fontFamily)).includes('EzraSIL'));
// bookmark jump
await page.click('#btnMenu'); await page.click('#miBookmarkGo');
await page.waitForFunction(() => document.getElementById('parshaName').textContent.includes('מַטּוֹת'));
const bmScroll = await page.$eval('#content', el => el.scrollTop);
check('bookmark restores parsha+scroll', bmScroll > 400, bmScroll);

console.log('== 9. location switch + daily plan + zen ==');
await page.click('#btnMenu'); await page.click('#miSettings');
await page.click('#segLoc [data-val=d]');
await page.click('.pageback');
await page.waitForSelector('.verse');
check('diaspora schedule loads (same week: Matot-Masei)', (await page.textContent('#parshaName')).includes('מַטּוֹת'));
await page.click('#btnMenu'); await page.click('#miSettings');
await page.click('#segLoc [data-val=il]');
await page.click('#setDailyPlan');
await page.click('.pageback');
await page.waitForSelector('#dayBanner:not(.hidden)');
const banner = await page.textContent('#dayBannerText');
check('daily plan banner (Tuesday -> shlishi)', banner.includes('שלישי'), banner);
await page.click('#dayBannerGo');
await page.waitForFunction(() => document.getElementById('aliyahName').textContent.trim() === 'שלישי');
check('banner go jumps to shlishi', true);
await page.click('#btnZen');
const zenHidden = await page.$eval('#topbar', el => getComputedStyle(el).display === 'none');
check('zen mode hides chrome', zenHidden);

console.log('== 9b. zen minimap preview: undistorted, right way up, tap-to-close ==');
await page.waitForTimeout(500);
const mm = await page.evaluate(() => {
  const prev = document.getElementById('zenMinimapPreview');
  const clone = prev.firstElementChild;
  const content = document.getElementById('content');
  return {
    transform: prev.style.transform,
    cloneBg: getComputedStyle(clone).backgroundColor,
    contentBg: getComputedStyle(content).backgroundColor,
    trackH: document.getElementById('zenMinimapTrack').getBoundingClientRect().height,
    maxH: window.innerHeight * 0.72,
  };
});
// a single-argument scale() => both axes shrunk equally; `scale(x, y)` was the old squashed look
check('preview is scaled uniformly, not squashed on one axis', /^scale\([\d.]+\)$/.test(mm.transform), mm.transform);
check('preview carries the page background, so light/dark are not inverted', mm.cloneBg === mm.contentBg, mm);
check('whole aliyah fits the track', mm.trackH <= mm.maxH + 1, mm);
await page.evaluate(() => document.getElementById('zenMinimap').classList.add('expanded', 'pinned'));
await page.waitForTimeout(300);
await page.screenshot({ path: SHOTS + '/09-zen-minimap.png' });
await page.mouse.click(220, 500); // tap the text itself
await page.waitForTimeout(250);
const mmCls = await page.$eval('#zenMinimap', el => el.className);
check('tapping the text collapses the preview (like the ✕)', !/expanded|pinned/.test(mmCls), mmCls);

console.log('== 9c. fullscreen time-left readout (off by default) ==');
check('fullscreen time readout hidden by default', !(await page.isVisible('#zenTime')));
await page.click('#zenExit');
await page.click('#btnMenu'); await page.click('#miSettings');
check('fullscreen-time toggle starts off', !(await page.isChecked('#setZenTime')));
await page.click('#setZenTime');
await page.click('#settingsPage .pageback');
check('toggle alone does not show it outside fullscreen', !(await page.isVisible('#zenTime')));
await page.click('#btnZen');
await page.waitForTimeout(300);
check('fullscreen time readout appears once enabled', await page.isVisible('#zenTime'));
check('fullscreen readout shows the aliyah estimate', /^⏱ .*\d/.test(await page.textContent('#zenTime')), await page.textContent('#zenTime'));
await page.click('#zenPlayBtn');
await page.waitForTimeout(900);
check('fullscreen readout goes live with auto-scroll', /^▶ \d+:\d\d/.test(await page.textContent('#zenTime')), await page.textContent('#zenTime'));
await page.screenshot({ path: SHOTS + '/09-zen-time.png' });
await page.click('#zenPlayBtn');
await page.click('#zenExit');
await page.click('#btnMenu'); await page.click('#miSettings');
await page.click('#setZenTime'); // back off
await page.click('#settingsPage .pageback');
check('zen exit restores', await page.$eval('#topbar', el => getComputedStyle(el).display !== 'none'));

console.log('== 10. language + edge cases ==');
await page.click('#btnMenu'); await page.click('#miSettings');
await page.click('#segLang [data-val=en]');
const engTitle = await page.textContent('#settingsBody h3');
check('english UI', engTitle.trim() === 'Targum', engTitle);
await page.click('#segLang [data-val=he]');
// haftara off -> aliyah nav clamps
await page.click('#segHaftara [data-val=without]');
await page.click('.pageback');
for (let i = 0; i < 10; i++) await page.click('#aliyahNext'); // should stop at end / roll to next parsha
await page.waitForSelector('.verse');
check('no crash when haftara disabled + nav spam', true);
// Vezot Haberakhah reachable via picker (Simchat Torah entry)
await page.click('#btnMenu'); await page.click('#miToday');
await page.waitForSelector('.verse');
await page.click('#parshaName');
await page.waitForSelector('#pickerList .pickrow');
const hasVezot = await page.$$eval('#pickerList .pickrow', els => els.some(e => e.textContent.includes('וְזֹאת הַבְּרָכָה')));
check('Vezot Haberakhah in picker (Simchat Torah)', hasVezot);
await page.click('[data-close=pickerModal]');

// First-verse-of-Bereshit sanity via picker impossible (past); check Devarim via next
console.log('== 11. auto-advance after Shabbat ==');
// simulate: position saved last week (week of 2026-07-04, Pinchas) -> should advance to Matot-Masei
await page.evaluate(() => {
  const posV = { loc: 'il', idx: JSON.parse(localStorage.getItem('sm_pos')).idx - 1, aliyah: 3, scroll: 200, week: '2026-07-04' };
  localStorage.setItem('sm_pos', JSON.stringify(posV));
});
await page.reload();
await page.waitForSelector('.verse');
check('auto-advance to new week after Shabbat passed', (await page.textContent('#parshaName')).includes('מַטּוֹת'));
check('auto-advance resets to rishon', (await page.textContent('#aliyahName')).trim() === 'ראשון');
// with setting off: stays
await page.evaluate(() => {
  const st = JSON.parse(localStorage.getItem('sm_settings')); st.autoAdvance = 'no'; localStorage.setItem('sm_settings', JSON.stringify(st));
  const posV = JSON.parse(localStorage.getItem('sm_pos')); posV.idx -= 1; posV.week = '2026-07-04'; localStorage.setItem('sm_pos', JSON.stringify(posV));
});
await page.reload();
await page.waitForSelector('.verse');
check('no auto-advance when setting off', (await page.textContent('#parshaName')).includes('פִּינְחָס'));

console.log('== done ==');
await page.screenshot({ path: SHOTS + '/07-final.png' });
await browser.close();
console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
