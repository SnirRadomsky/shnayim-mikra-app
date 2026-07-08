/**
 * Build offline data assets for the Shnayim Mikra app.
 * Fetches from Sefaria API + @hebcal/leyning + @hebcal/core.
 * Output: /home/user/zmanim/shnayim-mikra/web/data/
 */
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import {getLeyningForParsha} from '@hebcal/leyning';
import {HebrewCalendar, HDate, months} from '@hebcal/core';

const OUT = path.join(__dirname, '../web/data');
const CACHE = path.join(__dirname, 'cache');
fs.mkdirSync(OUT, {recursive: true});
fs.mkdirSync(path.join(OUT, 'torah'), {recursive: true});
fs.mkdirSync(CACHE, {recursive: true});

const TAAMEI = 'hebrew|Tanach with Ta\'amei Hamikra';
const BOOKS = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'];
const BOOK_HE = {Genesis: 'בראשית', Exodus: 'שמות', Leviticus: 'ויקרא', Numbers: 'במדבר', Deuteronomy: 'דברים'};

const PARSHIYOT = [
  'Bereshit','Noach','Lech-Lecha','Vayera','Chayei Sara','Toldot','Vayetzei','Vayishlach','Vayeshev','Miketz','Vayigash','Vayechi',
  'Shemot','Vaera','Bo','Beshalach','Yitro','Mishpatim','Terumah','Tetzaveh','Ki Tisa','Vayakhel','Pekudei',
  'Vayikra','Tzav','Shmini','Tazria','Metzora','Achrei Mot','Kedoshim','Emor','Behar','Bechukotai',
  'Bamidbar','Nasso','Beha\'alotcha','Sh\'lach','Korach','Chukat','Balak','Pinchas','Matot','Masei',
  'Devarim','Vaetchanan','Eikev','Re\'eh','Shoftim','Ki Teitzei','Ki Tavo','Nitzavim','Vayeilech','Ha\'azinu','Vezot Haberakhah',
];
const COMBOS = ['Vayakhel-Pekudei','Tazria-Metzora','Achrei Mot-Kedoshim','Behar-Bechukotai','Chukat-Balak','Matot-Masei','Nitzavim-Vayeilech'];

async function fetchJson(url) {
  const key = url.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 180);
  const file = path.join(CACHE, key + '.json');
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const data = await res.json();
      fs.writeFileSync(file, JSON.stringify(data));
      return data;
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
}

async function fetchVersionText(indexName, version) {
  const url = `https://www.sefaria.org/api/v3/texts/${encodeURIComponent(indexName)}?version=${encodeURIComponent(version)}`;
  const d = await fetchJson(url);
  const v = d.versions && d.versions[0];
  if (!v || !v.text) throw new Error(`No text for ${indexName} / ${version}`);
  return v.text;
}

// --- sanitizers ---------------------------------------------------------
function cleanMikra(s) {
  if (typeof s !== 'string') return '';
  s = s.replace(/<br\s*\/?>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&thinsp;/g, ' ')
    .replace(/&amp;/g, '&');
  // Normalize petucha/setuma markers to {פ}/{ס}
  s = s.replace(/\((פ|ס)\)/g, '{$1}').replace(/\{(פ|ס)\}/g, '{$1}');
  return s.replace(/\s+/g, ' ').trim();
}
function cleanOnkelos(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/<[^>]+>/g, '').replace(/&nbsp;|&thinsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
function cleanRashi(s) {
  if (typeof s !== 'string') return '';
  // keep <b> (dibbur hamatchil) and <i>; strip everything else
  s = s.replace(/<br\s*\/?>/g, ' ')
    .replace(/<(?!\/?[bi]>)[^>]+>/g, '')
    .replace(/&nbsp;|&thinsp;/g, ' ')
    .replace(/&amp;/g, '&');
  return s.replace(/\s+/g, ' ').trim();
}

// --- torah + onkelos + rashi per book -----------------------------------
async function buildBooks() {
  for (const book of BOOKS) {
    console.log('book:', book);
    const [mikra, onkelos, rashi] = await Promise.all([
      fetchVersionText(book, TAAMEI),
      fetchVersionText(`Onkelos ${book}`, 'hebrew'),
      fetchVersionText(`Rashi on ${book}`, 'hebrew'),
    ]);
    const nCh = mikra.length;
    const out = {book, he: BOOK_HE[book], chapters: []};
    for (let c = 0; c < nCh; c++) {
      const mCh = mikra[c] || [];
      const oCh = onkelos[c] || [];
      const rCh = rashi[c] || [];
      const verses = [];
      for (let v = 0; v < mCh.length; v++) {
        verses.push({
          m: cleanMikra(mCh[v]),
          t: cleanOnkelos(oCh[v] || ''),
          r: (Array.isArray(rCh[v]) ? rCh[v] : (rCh[v] ? [rCh[v]] : [])).map(cleanRashi).filter(Boolean),
        });
      }
      out.chapters.push(verses);
    }
    fs.writeFileSync(path.join(OUT, 'torah', `${book}.json`), JSON.stringify(out));
    console.log('  chapters:', nCh, 'size:', fs.statSync(path.join(OUT, 'torah', `${book}.json`)).size);
  }
}

// --- parshiyot metadata ---------------------------------------------------
function refParts(k, b, e) { // {book, b:[c,v], e:[c,v]}
  const [bc, bv] = b.split(':').map(Number);
  const [ec, ev] = e.split(':').map(Number);
  return {k, b: [bc, bv], e: [ec, ev]};
}

function buildParshiyot() {
  const all = {};
  for (const name of [...PARSHIYOT, ...COMBOS]) {
    const r = getLeyningForParsha(name);
    if (!r) throw new Error('no leyning for ' + name);
    const aliyot = [];
    for (let i = 1; i <= 7; i++) {
      const a = r.fullkriyah[String(i)];
      aliyot.push(refParts(a.k, a.b, a.e));
    }
    all[name] = {
      he: r.name.he.replace(/[֑-֯]/g, ''), // strip accents from display name
      combo: r.parsha.length > 1 ? r.parsha : undefined,
      book: r.fullkriyah['1'].k,
      aliyot,
      haftAshk: (r.haft ? (Array.isArray(r.haft) ? r.haft : [r.haft]) : []).map(h => refParts(h.k, h.b, h.e)),
      haftSeph: (r.seph ? (Array.isArray(r.seph) ? r.seph : [r.seph]) : (r.haft ? (Array.isArray(r.haft) ? r.haft : [r.haft]) : [])).map(h => refParts(h.k, h.b, h.e)),
      haftAshkLabel: r.haftara || '',
      haftSephLabel: r.sephardic || r.haftara || '',
    };
  }
  fs.writeFileSync(path.join(OUT, 'parshiyot.json'), JSON.stringify(all));
  console.log('parshiyot:', Object.keys(all).length);
  return all;
}

// --- haftara texts --------------------------------------------------------
async function buildHaftarot(parshiyot) {
  const bookCache = {};
  async function getBook(k) {
    if (!bookCache[k]) bookCache[k] = await fetchVersionText(k, TAAMEI);
    return bookCache[k];
  }
  const out = {}; // parsha -> {a:[{ref, verses:[{c,v,t}]}], s:[...]}
  for (const [name, p] of Object.entries(parshiyot)) {
    const entry = {};
    for (const [key, refs] of [['a', p.haftAshk], ['s', p.haftSeph]]) {
      const segs = [];
      for (const ref of refs) {
        const text = await getBook(ref.k);
        const verses = [];
        for (let c = ref.b[0]; c <= ref.e[0]; c++) {
          const ch = text[c - 1] || [];
          const vStart = c === ref.b[0] ? ref.b[1] : 1;
          const vEnd = c === ref.e[0] ? ref.e[1] : ch.length;
          for (let v = vStart; v <= vEnd; v++) {
            verses.push({c, v, t: cleanMikra(ch[v - 1] || '')});
          }
        }
        segs.push({k: ref.k, verses});
      }
      entry[key] = segs;
    }
    out[name] = entry;
  }
  fs.writeFileSync(path.join(OUT, 'haftarot.json'), JSON.stringify(out));
  console.log('haftarot size:', fs.statSync(path.join(OUT, 'haftarot.json')).size);
}

// --- schedule --------------------------------------------------------------
function buildSchedule() {
  const out = {il: [], d: []};
  for (const il of [true, false]) {
    const events = HebrewCalendar.calendar({
      start: new Date(2025, 0, 1),
      end: new Date(2046, 11, 31),
      sedrot: true,
      il,
      noHolidays: true,
    });
    const arr = il ? out.il : out.d;
    for (const ev of events) {
      if (!ev.parsha) continue;
      const key = ev.parsha.join('-');
      const d = ev.getDate().greg();
      const ds = d.toISOString().slice(0, 10);
      arr.push([ds, key]);
    }
    // Vezot Haberakhah → Simchat Torah (22 Tishrei IL / 23 Tishrei diaspora)
    for (let hy = 5785; hy <= 5807; hy++) {
      const st = new HDate(il ? 22 : 23, months.TISHREI, hy);
      const g = st.greg();
      if (g >= new Date(2025, 0, 1) && g <= new Date(2046, 11, 31)) {
        arr.push([g.toISOString().slice(0, 10), 'Vezot Haberakhah']);
      }
    }
    arr.sort((a, b) => a[0] < b[0] ? -1 : 1);
  }
  fs.writeFileSync(path.join(OUT, 'schedule.json'), JSON.stringify(out));
  console.log('schedule entries il/d:', out.il.length, out.d.length);
}

(async () => {
  const parshiyot = buildParshiyot();
  buildSchedule();
  await buildBooks();
  await buildHaftarot(parshiyot);
  console.log('DONE');
})().catch(e => { console.error(e); process.exit(1); });
