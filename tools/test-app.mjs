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
// go to haftara via next-arrows: 7 times (shlishi..haftara)
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

console.log('== 5. progress: done button, chip, progress page ==');
let chip = await page.textContent('#progressChip');
check('chip starts 0%', chip === '0%', chip);
await page.$eval('#btnAliyahDone', el => el.scrollIntoView());
await page.click('#btnAliyahDone');
await page.waitForFunction(() => document.getElementById('aliyahName').textContent.trim() === 'שני');
check('done -> advances to sheni', true);
chip = await page.textContent('#progressChip');
check('chip 13% after 1/8', chip === '13%', chip);
await page.click('#btnMenu'); await page.click('#miProgress');
await page.waitForSelector('.alcell');
const cells = await page.$$eval('.alcell', els => els.map(e => ({ txt: e.textContent, done: e.classList.contains('done') })));
check('8 aliyah cells, rishon done', cells.length === 8 && cells[0].done && !cells[1].done, cells.map(c => c.done));
// toggle sheni via grid
await page.click('.alcell[data-al="1"]');
const streak = await page.$eval('.progstats .statbox .n', el => el.textContent);
check('streak box renders', /^\d+$/.test(streak), streak);
await page.waitForFunction(() => /^\d+$/.test(document.getElementById('versesLeftN').textContent));
const vl = await page.$eval('#versesLeftN', el => +el.textContent);
check('verses-left computed (Matot-Masei total 244, minus rishon 28 & sheni 42 = 174)', vl === 174, vl);
await page.screenshot({ path: SHOTS + '/05-progress.png' });
await page.click('#progressPage .pageback');

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
// bookmark
await page.$eval('#content', el => el.scrollTop = 500);
await page.waitForTimeout(400);
await page.click('#btnBookmark');
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
await page.click('#zenExit');
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
