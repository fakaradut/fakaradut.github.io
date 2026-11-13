// Builds the Turkish page and the sitemap from index.html (the English page, the one to edit):
//   node build.mjs
// The page's script fills in the Turkish words; this sets what search engines and link previews read first.
// It also writes the Fluffytail privacy and support pages (English and Turkish) from content/fluffytail.mjs, and
// merges the Fluffytail game site's own sitemap (fluffytail/sitemap-0.xml, 34 languages, built by sincap/web) into
// sitemap.xml. Run it after sincap/web/scripts/deploy-local.sh has copied the game site in.
import fs from 'node:fs';
import { writeFluffytail } from './content/fluffytail.mjs';

const en = fs.readFileSync('index.html', 'utf8');
const swaps = [
  ['<html lang="en">', '<html lang="tr">'],
  ['<title>Moon Arc Works – calm, useful mobile apps and games</title>', '<title>Moon Arc Works – sakin ve işe yarar mobil uygulamalar ve oyunlar</title>'],
  ['<meta name="description" content="Moon Arc Works is an independent studio making calm, useful mobile apps and games.">',
    '<meta name="description" content="Moon Arc Works sakin ve işe yarar mobil uygulamalar ve oyunlar yapan bağımsız bir stüdyo. İlk uygulamamız Dumansız, sigarayı ve vape\'i bırakmana yardım eder.">'],
  ['<link rel="canonical" href="https://moonarcworks.com/">', '<link rel="canonical" href="https://moonarcworks.com/tr/">'],
  ['<meta property="og:url" content="https://moonarcworks.com/">', '<meta property="og:url" content="https://moonarcworks.com/tr/">'],
  ['<meta property="og:locale" content="en_US">', '<meta property="og:locale" content="tr_TR">'],
  ['<meta property="og:description" content="An independent studio making calm, useful mobile apps and games.">',
    '<meta property="og:description" content="Sakin ve işe yarar mobil uygulamalar ve oyunlar yapan bağımsız bir stüdyo.">'],
  // Links to the game point at its Turkish pages (the page's script sets the same for visitors).
  ['<a class="game" id="ft-link" href="/fluffytail/" data-reveal>', '<a class="game" id="ft-link" href="/fluffytail/tr/" data-reveal>'],
  ['<a id="ft-foot" href="/fluffytail/" data-i18n="ftShort">', '<a id="ft-foot" href="/fluffytail/tr/" data-i18n="ftShort">'],
];
let tr = en;
for (const [from, to] of swaps) {
  if (!tr.includes(from)) throw new Error(`Not found in index.html: ${from}`);
  tr = tr.replace(from, to);
}
fs.mkdirSync('tr', { recursive: true });
fs.writeFileSync('tr/index.html', tr);

const fluffytail = writeFluffytail();

const today = new Date().toISOString().slice(0, 10);
const alt = (en, tr) => `<xhtml:link rel="alternate" hreflang="en" href="${en}"/><xhtml:link rel="alternate" hreflang="tr" href="${tr}"/><xhtml:link rel="alternate" hreflang="x-default" href="${en}"/>`;
const home = { en: 'https://moonarcworks.com/', tr: 'https://moonarcworks.com/tr/' };
const urls = [[home.en, home], [home.tr, home], ...fluffytail];
const entries = urls.map(([loc, a]) => `  <url><loc>${loc}</loc><lastmod>${today}</lastmod>${alt(a.en, a.tr)}</url>`);
// The game site's pages, with their hreflang links to all 34 languages.
const gameMap = 'fluffytail/sitemap-0.xml';
const game = fs.existsSync(gameMap) ? fs.readFileSync(gameMap, 'utf8').match(/<url>[\s\S]*?<\/url>/g) ?? [] : [];
if (!game.length) console.warn(`No ${gameMap}: run sincap/web/scripts/deploy-local.sh first to add the game pages.`);
for (const u of game) entries.push(`  ${u.replace('</loc>', `</loc><lastmod>${today}</lastmod>`)}`);
fs.writeFileSync(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`,
);
console.log(`Wrote tr/index.html, ${fluffytail.length} Fluffytail legal pages, the /tr/fluffytail/ redirect and sitemap.xml (${entries.length} URLs, ${game.length} from the game site)`);
