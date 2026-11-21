// Language menu shared by the Moon Arc Works sites: AirAgain, Petiverse, Fluffytail and the studio pages.
// Three files, the same on every site; change one, copy it to the others:
//   lang-menu.mjs  the markup, made at build time (this file)
//   lang-menu.css  the look; colours come from the --lm-* variables each site sets
//   lang-menu.js   search, keyboard, closing, the phone sheet (without it: a <details> list of links)
// Flags: country-flag-icons 3x2 (MIT, github.com/catamphetamine/country-flag-icons), the files in flags/.

/** The country whose flag stands for each language. A site may override one (Fluffytail: en → GB, as in the game). */
export const FLAGS = {
  en: 'US', tr: 'TR', de: 'DE', es: 'ES', pt: 'BR', fr: 'FR', it: 'IT', nl: 'NL', pl: 'PL', cs: 'CZ', sk: 'SK',
  hu: 'HU', ro: 'RO', bg: 'BG', hr: 'HR', sr: 'RS', el: 'GR', ru: 'RU', uk: 'UA', sv: 'SE', da: 'DK', nb: 'NO',
  fi: 'FI', ar: 'SA', he: 'IL', hi: 'IN', id: 'ID', ms: 'MY', vi: 'VN', th: 'TH', ja: 'JP', ko: 'KR',
  'zh-Hans': 'CN', 'zh-Hant': 'TW',
};

/** Lists this long get the search field and the wide grid. */
const MANY = 10;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const english = new Intl.DisplayNames(['en'], { type: 'language' });

/**
 * @param {object} o
 * @param {string} o.current  code of the page's language
 * @param {{ code: string, name: string, href: string }[]} o.langs  every language, name in its own words
 * @param {string} o.label  "Language" in the page's language
 * @param {(country: string) => string} o.flag  URL of a country's flag file
 * @param {Record<string, string>} [o.flags]  this site's own language → country choices
 */
export function langMenu({ current, langs, label, flag, flags = {} }) {
  const country = (code) => flags[code] ?? FLAGS[code] ?? FLAGS[code.split('-')[0]];
  const img = (code, lazy) =>
    `<img class="lm-flag" src="${esc(flag(country(code)))}" alt="" width="21" height="14"${lazy ? ' loading="lazy"' : ''} decoding="async">`;
  const here = langs.find((l) => l.code === current) ?? langs[0];
  const many = langs.length >= MANY;
  const chevron = '<svg class="lm-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  const glass = '<svg class="lm-glass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
  return (
    `<details class="lm${many ? ' lm-many' : ''}" data-lm>` +
    `<summary class="lm-btn"><span class="lm-sr">${esc(label)}: </span>${img(here.code)}` +
    `<span class="lm-name" lang="${here.code}">${esc(here.name)}</span>` +
    `<span class="lm-code" aria-hidden="true">${esc(here.code.split('-')[0].toUpperCase())}</span>${chevron}</summary>` +
    `<div class="lm-panel">` +
    (many
      ? `<div class="lm-top" hidden>${glass}<input class="lm-q" type="search" autocomplete="off" spellcheck="false" placeholder="${esc(label)}" aria-label="${esc(label)}"><span class="lm-count" role="status"></span></div>`
      : '') +
    `<ul class="lm-list" aria-label="${esc(label)}">` +
    langs
      .map(
        (l) =>
          `<li><a href="${esc(l.href)}" hreflang="${l.code}" lang="${l.code}" data-q="${esc(`${l.code} ${english.of(l.code)}`)}"` +
          `${l.code === here.code ? ' aria-current="page"' : ''}>${img(l.code, true)}<span>${esc(l.name)}</span></a></li>`,
      )
      .join('') +
    `</ul></div></details>`
  );
}
