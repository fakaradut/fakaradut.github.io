// Builds the studio page in 34 languages and the sitemap from index.html (the page's markup and script) and
// content/i18n/<lang>.json (its words, one file per language):
//   node build.mjs
// English is index.html itself, rewritten in place; every other language goes to /<lang>/index.html (/zh-hans/ …).
// Each page carries only its own words, already in the markup, so search engines and link previews read them first.
// To change a word, edit content/i18n/<lang>.json (en.json for English) and run this; a new key goes into every file.
// It also writes the Fluffytail privacy and support pages (English and Turkish) from content/fluffytail.mjs, and
// merges the Fluffytail game site's own sitemap (fluffytail/sitemap-0.xml, 34 languages, built by sincap/web) into
// sitemap.xml, and Petiverse's sitemap (petiverse/sitemap.xml, built by pet-care/site/build.mjs --deploy).
// Run it after sincap/web/scripts/deploy-local.sh has copied the game site in.
import fs from 'node:fs';
import { writeFluffytail } from './content/fluffytail.mjs';
import { langMenu } from './content/lang-menu.mjs';

const SITE = 'https://moonarcworks.com';
// The apps' languages, in the order and with the names of the shared language menu (as on the Fluffytail site).
const LANGS = [
  ['en', 'English'], ['tr', 'Türkçe'], ['de', 'Deutsch'], ['fr', 'Français'], ['es', 'Español'], ['it', 'Italiano'],
  ['pt', 'Português'], ['nl', 'Nederlands'], ['pl', 'Polski'], ['cs', 'Čeština'], ['sk', 'Slovenčina'], ['hu', 'Magyar'],
  ['ro', 'Română'], ['hr', 'Hrvatski'], ['sr', 'Српски'], ['bg', 'Български'], ['el', 'Ελληνικά'], ['ru', 'Русский'],
  ['uk', 'Українська'], ['sv', 'Svenska'], ['nb', 'Norsk'], ['da', 'Dansk'], ['fi', 'Suomi'], ['ar', 'العربية'],
  ['he', 'עברית'], ['hi', 'हिन्दी'], ['th', 'ไทย'], ['vi', 'Tiếng Việt'], ['id', 'Bahasa Indonesia'],
  ['ms', 'Bahasa Melayu'], ['ja', '日本語'], ['ko', '한국어'], ['zh-Hans', '简体中文'], ['zh-Hant', '繁體中文'],
];
const RTL = new Set(['ar', 'he']);
const dir = (code) => (code === 'en' ? '' : `${code.toLowerCase()}/`);
const words = Object.fromEntries(LANGS.map(([code]) => [code, JSON.parse(fs.readFileSync(`content/i18n/${code}.json`, 'utf8'))]));
for (const [code] of LANGS) {
  const missing = Object.keys(words.en).filter((k) => !(k in words[code]));
  if (missing.length) throw new Error(`content/i18n/${code}.json is missing ${missing.join(', ')}`);
}
// Screens: AirAgain's and Petiverse's own frames for English and Turkish; AirAgain's other languages come from the
// AirAgain site (same frames, /airagain/shots/), Petiverse's stay English until there are frames for them.
const aaShot = (code, shot) => (code === 'en' || code === 'tr' ? `/assets/airagain-${shot}-${code}.webp` : `/airagain/shots/${code}/${shot}-dark.webp`);
const pvShot = (code, n) => `/assets/petiverse-${n}-${code === 'tr' ? 'tr' : 'en'}.webp`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const once = (html, re, to) => {
  if (!re.test(html)) throw new Error(`Not found in index.html: ${re}`);
  return html.replace(re, to);
};

// The language menu shared by the studio's sites (content/lang-menu.mjs) goes between <!--lm--> and <!--/lm-->.
const menu = (code) => `<!--lm-->${langMenu({
  current: code,
  label: words[code].language,
  flag: (country) => `/assets/flags/${country}.svg`,
  langs: LANGS.map(([c, name]) => ({ code: c, name, href: `/${dir(c)}` })),
})}<!--/lm-->`;
const alternates = LANGS.map(([c]) => `<link rel="alternate" hreflang="${c}" href="${SITE}/${dir(c)}">\n`).join('') +
  `<link rel="alternate" hreflang="x-default" href="${SITE}/">\n`;
// The release days of Fluffytail and Petiverse, read from the page's script, for the words shown before it runs.
const source = fs.readFileSync('index.html', 'utf8');
const release = (id) => {
  const m = source.match(new RegExp(`${id}: \\{ at: new Date\\((\\d+), (\\d+), (\\d+)\\)`));
  if (!m) throw new Error(`No ${id} release day in index.html`);
  return new Date(+m[1], +m[2], +m[3]);
};
const releases = { ft: release('ft'), pv: release('pv') };

function page(code) {
  const t = words[code], lc = code.toLowerCase(), url = `${SITE}/${dir(code)}`;
  let html = source;
  html = once(html, /<html[^>]*>/, `<html lang="${code}"${RTL.has(code) ? ' dir="rtl"' : ''}>`);
  html = once(html, /<title>[^<]*<\/title>/, `<title>${esc(t.metaTitle)}</title>`);
  html = once(html, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(t.metaDesc)}">`);
  html = once(html, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  html = once(html, /(<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n)+/, alternates);
  html = once(html, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  html = once(html, /<meta property="og:locale" content="[^"]*">/, `<meta property="og:locale" content="${t.ogLocale}">`);
  html = once(html, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(t.ogDesc)}">`);
  // The studio's description in the structured data (the Organization's, the only one with a description).
  html = once(html, /("@type":"Organization",[^}]*"description":)"(?:[^"\\]|\\.)*"/, (_, head) => `${head}${JSON.stringify(t.ogDesc)}`);
  html = html.replace(/<!--lm-->[\s\S]*?<!--\/lm-->/, () => menu(code));
  // Words: each element with data-i18n="key" holds t[key] (HTML), each image with data-i18n-alt="key" its alt text.
  html = html.replace(/(<(\w+)\b[^>]*\bdata-i18n="(\w+)"[^>]*>)[\s\S]*?(<\/\2>)/g, (_, open, tag, key, close) => {
    if (typeof t[key] !== 'string') throw new Error(`No "${key}" in content/i18n/${code}.json`);
    return open + t[key] + close;
  });
  html = html.replace(/<img\b[^>]*\bdata-i18n-alt="(\w+)"[^>]*>/g, (img, key) => img.replace(/ alt="[^"]*"/, ` alt="${esc(t[key])}"`));
  // The headline: each word rises in turn; a word starting with * is the gold serif one.
  let i = 0;
  const h1 = t.h1.map((line) => line.map((w) => w.startsWith('*')
    ? `<span class="rise" style="--i:${i++}"><span class="serif shimmer">${w.slice(1)}</span></span>`
    : `<span class="rise" style="--i:${i++}">${w}</span>`).join(' ')).join('<br>');
  html = once(html, /<h1 id="h1">[\s\S]*?<\/h1>/, `<h1 id="h1">${h1}</h1>`);
  // Words the script keeps up to date, as they read when the page is built.
  html = once(html, /(<div class="label" id="launch-label">)[^<]*/, `$1${t.launchSoon}`);
  for (const [id, at] of Object.entries(releases)) {
    const date = new Intl.DateTimeFormat(code, { day: 'numeric', month: 'long' }).format(at);
    const text = Date.now() >= at.getTime() ? t.appleOut : t.appleSoon.replace('{date}', date);
    html = once(html, new RegExp(`(<div class="label" id="${id}-when">)[\\s\\S]*?(</div>)`), (_, a, b) => a + text + b);
  }
  html = once(html, /(<b id="clock">)[^<]*/, `$147${t.dayShort} 05:23:02`);
  html = once(html, /(<span id="tonight-text">)[^<]*/, `$1${t.tonightLabel}`);
  // Links and screens in the page's language.
  html = once(html, /(id="site-link" href=")[^"]*/, `$1/airagain/${lc}/`);
  html = once(html, /(id="ft-link" href=")[^"]*/, `$1/fluffytail/${dir(code)}`);
  html = once(html, /(id="ft-foot" href=")[^"]*/, `$1/fluffytail/${dir(code)}`);
  html = once(html, /(id="pv-link" href=")[^"]*/, `$1/petiverse/${code === 'en' ? '' : `${code}/`}`);
  html = once(html, /(id="ft-trailer" href="https:\/\/www\.youtube\.com\/watch\?v=)[^"]*/, `$1${t.ftVideo}`);
  html = html.replace(/(<img\b[^>]*\bdata-shot="(\w+)"[^>]*\bsrc=")[^"]*/g, (_, a, shot) => a + aaShot(code, shot));
  html = html.replace(/(<img\b[^>]*\bdata-pv="(\d+)"[^>]*\bsrc=")[^"]*/g, (_, a, n) => a + pvShot(code, n));
  html = html.replace(/(<img\b[^>]*\bdata-ft="(\d+)"[^>]*\bsrc=")[^"]*/g, (_, a, n) => `${a}/fluffytail/gen/shots/${lc}/${n}-1600.webp`);
  // The script's own copy of the words it changes as time passes (see "Words" in index.html).
  const live = Object.fromEntries(['launchOut', 'dayShort', 'appleSoon', 'appleOut', 'preorder', 'tonight', 'phases'].map((k) => [k, t[k]]));
  const json = JSON.stringify(live).replace(/<\//g, '<\\/');
  html = once(html, /const T = .*;\n/, () => `const T = ${json};\n`);
  return html;
}

for (const [code] of LANGS) {
  const file = `${dir(code)}index.html`;
  const html = page(code);
  if (code !== 'en') fs.mkdirSync(dir(code), { recursive: true });
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== html) fs.writeFileSync(file, html);
}

const fluffytail = writeFluffytail();

const today = new Date().toISOString().slice(0, 10);
const alt = (a) => Object.entries(a).map(([l, href]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${href}"/>`).join('') +
  `<xhtml:link rel="alternate" hreflang="x-default" href="${a.en}"/>`;
const home = Object.fromEntries(LANGS.map(([c]) => [c, `${SITE}/${dir(c)}`]));
const urls = [...LANGS.map(([c]) => [home[c], home]), ...fluffytail];
const entries = urls.map(([loc, a]) => `  <url><loc>${loc}</loc><lastmod>${today}</lastmod>${alt(a)}</url>`);
// The game site's pages, with their hreflang links to all 34 languages.
const gameMap = 'fluffytail/sitemap-0.xml';
const game = fs.existsSync(gameMap) ? fs.readFileSync(gameMap, 'utf8').match(/<url>[\s\S]*?<\/url>/g) ?? [] : [];
if (!game.length) console.warn(`No ${gameMap}: run sincap/web/scripts/deploy-local.sh first to add the game pages.`);
for (const u of game) entries.push(`  ${u.replace('</loc>', `</loc><lastmod>${today}</lastmod>`)}`);
// Petiverse's pages (34 languages as they arrive, with hreflang), built by pet-care/site/build.mjs --deploy.
const petMap = 'petiverse/sitemap.xml';
const pet = fs.existsSync(petMap) ? fs.readFileSync(petMap, 'utf8').match(/<url>[\s\S]*?<\/url>/g) ?? [] : [];
for (const u of pet) entries.push(`  ${u}`);
fs.writeFileSync(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`,
);
console.log(`Wrote ${LANGS.length} studio pages, ${fluffytail.length} Fluffytail legal pages, the /tr/fluffytail/ redirect and sitemap.xml (${entries.length} URLs, ${game.length} from the game site, ${pet.length} from Petiverse)`);
