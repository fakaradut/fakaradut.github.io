// Builds the Turkish page and the sitemap from index.html (the English page, the one to edit):
//   node build.mjs
// The page's script fills in the Turkish words; this sets what search engines and link previews read first.
import fs from 'node:fs';

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
];
let tr = en;
for (const [from, to] of swaps) {
  if (!tr.includes(from)) throw new Error(`Not found in index.html: ${from}`);
  tr = tr.replace(from, to);
}
fs.mkdirSync('tr', { recursive: true });
fs.writeFileSync('tr/index.html', tr);

const today = new Date().toISOString().slice(0, 10);
const alt = '<xhtml:link rel="alternate" hreflang="en" href="https://moonarcworks.com/"/><xhtml:link rel="alternate" hreflang="tr" href="https://moonarcworks.com/tr/"/>';
fs.writeFileSync(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url><loc>https://moonarcworks.com/</loc><lastmod>${today}</lastmod>${alt}</url>
  <url><loc>https://moonarcworks.com/tr/</loc><lastmod>${today}</lastmod>${alt}</url>
</urlset>
`,
);
console.log('Wrote tr/index.html and sitemap.xml');
