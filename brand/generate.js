// Moon Arc Works brand files from one crescent (logo A): vector marks, icons, favicons and store/social images.
// Run: node brand/generate.js   (uses @resvg/resvg-js from the dumansiz project; fonts in brand/fonts)
const fs = require('fs');
const path = require('path');
const { Resvg } = require(path.join(process.env.HOME, 'Desktop/projects/dumansiz/node_modules/@resvg/resvg-js'));

const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

// Colours: night sky and moonlight.
const NIGHT = '#0B1026';
const NIGHT_2 = '#18214A';
const GOLD_LIGHT = '#FFE2A3';
const GOLD_DARK = '#E9A94B';
const INK = '#E9EDF7';

// The crescent: a disc of radius 36 at (48, 52) with a disc of radius 31 at (62, 40) taken out, in a 100-unit box.
// Its bounding box centre is (47, 52.3); MARK_CENTRE moves it onto (50, 50).
const CRESCENT = 'M41.723 16.552 A36 36 0 1 0 82.071 63.625 A31 31 0 0 1 41.723 16.552 Z';
const MARK_CENTRE = 'translate(3 -2.3)';

const gradient = (id) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${GOLD_LIGHT}"/><stop offset="1" stop-color="${GOLD_DARK}"/></linearGradient>`;

/** The crescent alone, filling `size` (a fraction of the box) around the centre of a w×h canvas. */
const crescent = (cx, cy, size, fill = 'url(#gold)') => {
  const s = size / 72; // the crescent is about 72 units across
  return `<g transform="translate(${cx} ${cy}) scale(${s}) translate(-50 -50)"><path transform="${MARK_CENTRE}" d="${CRESCENT}" fill="${fill}"/></g>`;
};

const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${gradient('gold')}
  <radialGradient id="sky" cx="0.3" cy="0.25" r="1"><stop offset="0" stop-color="${NIGHT_2}"/><stop offset="1" stop-color="${NIGHT}"/></radialGradient></defs>${body}</svg>`;

const FONTS = { fontFiles: [path.join(__dirname, 'fonts/Sora-600.ttf'), path.join(__dirname, 'fonts/Sora-400.ttf')], loadSystemFonts: false, defaultFontFamily: 'Sora' };

function png(name, source, width) {
  const image = new Resvg(source, { font: FONTS, fitTo: width ? { mode: 'width', value: width } : { mode: 'original' } }).render();
  fs.writeFileSync(path.join(OUT, name), image.asPng());
  console.log(`${name.padEnd(28)} ${image.width}×${image.height}`);
}
function write(name, source) {
  fs.writeFileSync(path.join(OUT, name), source);
  console.log(name);
}

// Vector marks.
write('mark.svg', svg(100, 100, crescent(50, 50, 80)));
write('mark-mono-dark.svg', svg(100, 100, crescent(50, 50, 80, NIGHT)));
write('mark-mono-light.svg', svg(100, 100, crescent(50, 50, 80, INK)));

// The app-style icon: the crescent on the night sky.
const icon = (s) => svg(s, s, `<rect width="${s}" height="${s}" fill="url(#sky)"/>${crescent(s / 2, s / 2, s * 0.58)}`);
write('icon.svg', icon(1024));
png('icon-1024.png', icon(1024)); // Instagram, TikTok, YouTube avatars
png('icon-512.png', icon(1024), 512); // Google Play developer page icon
png('apple-touch-icon.png', icon(1024), 180);
png('favicon-32.png', icon(1024), 32);
// The favicon keeps the crescent bigger, so it still reads at 16 px.
const favicon = svg(64, 64, `<rect width="64" height="64" rx="14" fill="${NIGHT}"/>${crescent(32, 32, 46)}`);
write('favicon.svg', favicon);

// Wordmarks: the crescent next to the name (the name stays live text in the SVGs, and is drawn in the PNGs).
const wordmark = (colour) =>
  svg(1220, 300, `${crescent(150, 150, 200)}<text x="285" y="186" font-family="Sora" font-weight="600" font-size="104" fill="${colour}">Moon Arc Works</text>`);
write('wordmark-on-dark.svg', wordmark(INK));
write('wordmark-on-light.svg', wordmark(NIGHT));
png('wordmark-on-dark.png', wordmark(INK));
png('wordmark-on-light.png', wordmark(NIGHT));

// Google Play developer page header (4096×2304): the night sky, the crescent and the name.
const header = svg(
  4096,
  2304,
  `<rect width="4096" height="2304" fill="url(#sky)"/>
  ${[...Array(60)].map((_, i) => {
    // A quiet field of dots, fixed so every render is the same.
    const x = (i * 733) % 4096, y = (i * 389) % 2304, r = 2 + (i % 3);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}" opacity="${0.12 + (i % 4) * 0.06}"/>`;
  }).join('')}
  ${crescent(1360, 1152, 900)}
  <text x="1960" y="1130" font-family="Sora" font-weight="600" font-size="230" fill="${INK}">Moon Arc</text>
  <text x="1966" y="1330" font-family="Sora" font-weight="400" font-size="120" letter-spacing="40" fill="${GOLD_LIGHT}">WORKS</text>`,
);
png('play-header-4096x2304.png', header);
