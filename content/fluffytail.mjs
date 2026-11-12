// Fluffytail: Squirrel Adventure – the game page, its privacy policy and its support page, in English and Turkish.
// build.mjs calls writeFluffytail() and writes:
//   fluffytail/index.html          tr/fluffytail/index.html
//   fluffytail/privacy/index.html  tr/fluffytail/privacy/index.html
//   fluffytail/support/index.html  tr/fluffytail/support/index.html
// Edit the words here, then run `node build.mjs`. The pages are plain HTML and CSS: no scripts, no cookies, no trackers.
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://moonarcworks.com';
const MAIL = 'support@moonarcworks.com';
const UPDATED = { en: '12 November 2026', tr: '12 Kasım 2026', iso: '2026-11-12' };

// The 34 languages of the game, each in its own words (the same list as the game's language picker).
const LANGS = [
  ['en', 'English'], ['tr', 'Türkçe'], ['de', 'Deutsch'], ['fr', 'Français'], ['es', 'Español'], ['it', 'Italiano'],
  ['pt', 'Português'], ['nl', 'Nederlands'], ['pl', 'Polski'], ['cs', 'Čeština'], ['sk', 'Slovenčina'], ['hu', 'Magyar'],
  ['ro', 'Română'], ['hr', 'Hrvatski'], ['sr', 'Српски'], ['bg', 'Български'], ['el', 'Ελληνικά'], ['ru', 'Русский'],
  ['uk', 'Українська'], ['sv', 'Svenska'], ['nb', 'Norsk'], ['da', 'Dansk'], ['fi', 'Suomi'], ['ar', 'العربية'],
  ['he', 'עברית'], ['hi', 'हिन्दी'], ['th', 'ไทย'], ['vi', 'Tiếng Việt'], ['id', 'Bahasa Indonesia'], ['ms', 'Bahasa Melayu'],
  ['ja', '日本語'], ['ko', '한국어'], ['zh-Hans', '简体中文'], ['zh-Hant', '繁體中文'],
];
const langList = LANGS.map(([code, name]) => `<span lang="${code}">${name}</span>`).join(', ');

const APPLE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.7-1-2.7-4.1zM13.9 5c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.4-.6 3.1-1.5z"/></svg>';
const PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 2.3c-.3.3-.4.7-.4 1.2v17c0 .5.1.9.4 1.2l9.4-9.7-9.4-9.7zm10.6 10.9 2.6 2.7-11.4 6.6 8.8-9.3zm3.9-4 3 1.7c.9.5.9 1.8 0 2.3l-3 1.8-2.9-2.9 2.9-2.9zM5.4 1.5l11.4 6.6-2.6 2.7-8.8-9.3z"/></svg>';
const MARK_SVG = '<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE7B3"/><stop offset="1" stop-color="#E39E3C"/></linearGradient></defs><path transform="translate(3 -2.3)" d="M41.723 16.552 A36 36 0 1 0 82.071 63.625 A31 31 0 0 1 41.723 16.552 Z" fill="url(#g)"/></svg>';

const CSS = `
  @font-face { font-family: Sora; font-weight: 400; src: url(/assets/Sora-400.ttf) format('truetype'); font-display: swap; }
  @font-face { font-family: Sora; font-weight: 600; src: url(/assets/Sora-600.ttf) format('truetype'); font-display: swap; }
  @font-face { font-family: Serif; font-style: italic; src: url(/assets/InstrumentSerif-Italic.woff2) format('woff2'); font-display: swap; }
  :root { --night: #070B1C; --night-2: #11183A; --ink: #EEF1FA; --muted: #A3ADCC; --line: rgba(238, 241, 250, .12);
    --gold: #F4C36A; --gold-light: #FFE7B3; --gold-dark: #E39E3C; --card: rgba(255, 255, 255, .035); }
  * { box-sizing: border-box; margin: 0; }
  html { -webkit-text-size-adjust: 100%; }
  body { background: var(--night); color: var(--ink); font: 400 17px/1.65 Sora, system-ui, sans-serif; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
  body::before { content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none;
    background: radial-gradient(60vw 45vw at 90% 0%, rgba(244, 195, 106, .09), transparent 65%),
      radial-gradient(60vw 50vw at 0% 30%, rgba(84, 104, 220, .15), transparent 65%),
      radial-gradient(50vw 40vw at 50% 110%, rgba(150, 90, 200, .10), transparent 65%); }
  a { color: var(--gold-light); text-underline-offset: 3px; }
  a:hover { color: #fff; }
  :focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; border-radius: 6px; }
  ::selection { background: var(--gold); color: var(--night); }
  .serif { font-family: Serif, Georgia, serif; font-style: italic; font-weight: 400; letter-spacing: -.5px; }
  .skip { position: absolute; left: 16px; top: -60px; background: var(--gold-light); color: var(--night); padding: 10px 16px; border-radius: 999px; font-weight: 600; z-index: 10; }
  .skip:focus { top: 12px; }
  .wrap { max-width: 1000px; margin: 0 auto; padding-inline: clamp(16px, 4vw, 24px); }
  .doc { max-width: 760px; }

  header { border-bottom: 1px solid var(--line); background: rgba(7, 11, 28, .6); }
  header .wrap { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; padding-block: 14px; }
  .brand { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 16px; color: var(--ink); text-decoration: none; }
  .brand svg { width: 26px; height: 26px; }
  header nav { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 14px; }
  header nav a { padding: 8px 12px; border-radius: 999px; color: var(--muted); text-decoration: none; }
  header nav a:hover { color: var(--ink); background: rgba(255, 255, 255, .06); }
  header nav a[aria-current="page"] { color: var(--ink); background: rgba(255, 255, 255, .08); }
  header nav a.lang { color: var(--ink); border: 1px solid var(--line); font-weight: 600; margin-left: 4px; }

  main { padding-block: 56px 80px; }
  .kicker { font-size: 13px; letter-spacing: 3px; text-transform: uppercase; color: var(--gold); margin-bottom: 14px; }
  h1 { font-weight: 600; font-size: clamp(34px, 6vw, 60px); line-height: 1.05; letter-spacing: -1.5px; }
  h1 .serif { color: var(--gold-light); font-size: 1.08em; }
  h2 { font-weight: 600; font-size: clamp(24px, 3.4vw, 32px); line-height: 1.2; letter-spacing: -.5px; margin: 48px 0 14px; }
  h3 { font-weight: 600; font-size: 19px; margin: 26px 0 6px; }
  p, ul, ol { margin-top: 12px; }
  ul, ol { padding-left: 1.3em; }
  li + li { margin-top: 6px; }
  .lead { margin-top: 18px; color: var(--muted); font-size: clamp(17px, 2vw, 20px); max-width: 34em; }
  .muted { color: var(--muted); }
  .updated { margin-top: 10px; color: var(--muted); font-size: 15px; }
  .box { margin-top: 28px; padding: 22px 24px; border: 1px solid var(--line); border-radius: 22px; background: var(--card); }
  .box h2 { margin-top: 0; font-size: 21px; }
  .box ul { margin-top: 8px; }

  .btn { display: inline-flex; align-items: center; gap: 10px; min-height: 50px; padding: 0 24px; border-radius: 999px; font-weight: 600; font-size: 15px; text-decoration: none; }
  .btn svg { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .btn-gold { background: linear-gradient(100deg, var(--gold-light), var(--gold-dark)); color: var(--night); }
  .btn-gold:hover { color: var(--night); filter: brightness(1.06); }
  .btn-ghost { border: 1px solid var(--line); background: rgba(255, 255, 255, .04); color: var(--ink); }
  .btn-ghost:hover { border-color: rgba(238, 241, 250, .35); color: var(--ink); }
  .actions { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 12px; }
  .soon { cursor: default; }
  .soon small { font-weight: 400; color: var(--muted); font-size: 13px; }

  /* Game page */
  .hero { display: grid; grid-template-columns: auto 1fr; gap: 28px; align-items: start; }
  .icon { width: 128px; height: 128px; border-radius: 28px; display: block; }
  .icon-ph { width: 128px; height: 128px; border-radius: 28px; border: 2px dashed rgba(244, 195, 106, .5); display: grid; place-items: center; text-align: center; padding: 10px; font-size: 12px; line-height: 1.3; color: var(--muted); background: rgba(244, 195, 106, .05); }
  .shots { margin-top: 40px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  /* PLACEHOLDER: screenshots (landscape, 16:9) go here. */
  .shot-ph { aspect-ratio: 16 / 9; border-radius: 16px; border: 2px dashed var(--line); display: grid; place-items: center; color: var(--muted); font-size: 13px; background: var(--card); text-align: center; padding: 8px; }
  .tiles { margin-top: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .tile { padding: 22px 22px 24px; border-radius: 22px; border: 1px solid var(--line); background: var(--card); }
  .tile h3 { margin-top: 0; }
  .tile p { color: var(--muted); font-size: 15px; margin-top: 6px; }
  .checks { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 24px; }
  .checks li { margin: 0; padding-left: 30px; position: relative; }
  .checks li::before { content: "✓"; position: absolute; left: 0; top: 0; width: 22px; height: 22px; border-radius: 50%; background: rgba(244, 195, 106, .15); color: var(--gold-light); font-size: 13px; display: grid; place-items: center; margin-top: 3px; }
  .links { margin-top: 40px; display: flex; flex-wrap: wrap; gap: 12px; }

  /* Support page */
  details { border: 1px solid var(--line); border-radius: 18px; background: var(--card); margin-top: 12px; }
  summary { cursor: pointer; padding: 16px 20px; font-weight: 600; list-style: none; display: flex; justify-content: space-between; gap: 16px; }
  summary::-webkit-details-marker { display: none; }
  summary::after { content: "+"; color: var(--gold); font-size: 22px; line-height: 1; flex: none; }
  details[open] summary::after { content: "–"; }
  details > div { padding: 0 20px 18px; color: #D3D8EA; }
  details > div > :first-child { margin-top: 0; }
  .langs { font-size: 15px; color: var(--muted); }

  footer { border-top: 1px solid var(--line); padding: 26px 0 36px; font-size: 14px; color: var(--muted); }
  footer .wrap { display: flex; flex-wrap: wrap; gap: 12px 26px; justify-content: space-between; }
  footer nav { display: flex; flex-wrap: wrap; gap: 8px 20px; }
  footer a { color: var(--muted); text-decoration: none; }
  footer a:hover { color: var(--ink); }

  @media (max-width: 640px) {
    main { padding-block: 36px 60px; }
    .hero { grid-template-columns: 1fr; gap: 20px; }
    .icon-ph { width: 96px; height: 96px; border-radius: 22px; }
    .shots, .tiles, .checks { grid-template-columns: 1fr; }
    .btn { width: 100%; justify-content: center; }
  }
`;

/* ---------------------------------------------------------------- words ---------------------------------------------------------------- */

const T = {
  en: {
    locale: 'en_US', base: '', other: 'tr', otherLabel: 'Türkçe', otherShort: 'TR',
    game: 'Fluffytail: Squirrel Adventure', gameHtml: 'Fluffytail: <span class="serif">Squirrel Adventure</span>',
    skip: 'Skip to content', home: 'Moon Arc Works home', nav: { game: 'Game', privacy: 'Privacy', support: 'Support' },
    foot: { studio: 'Moon Arc Works', contact: 'Contact' },
    pages: {
      game: {
        title: 'Fluffytail: Squirrel Adventure – a 3D adventure for kids | Moon Arc Works',
        desc: 'A 3D squirrel adventure for kids aged 6–8: run, climb and glide through five worlds to bring Peanut home. No ads, no tracking, works offline. Coming soon to iPhone, iPad and Android.',
      },
      privacy: {
        title: 'Privacy Policy – Fluffytail: Squirrel Adventure | Moon Arc Works',
        desc: 'Fluffytail: Squirrel Adventure collects no personal data: no ads, no analytics, no tracking, no accounts. Saves stay on the device.',
      },
      support: {
        title: 'Support – Fluffytail: Squirrel Adventure | Moon Arc Works',
        desc: 'Help for parents: restore the Full Adventure, Family Sharing, deleting the save, languages and device requirements for Fluffytail: Squirrel Adventure.',
      },
    },
  },
  tr: {
    locale: 'tr_TR', base: '/tr', other: 'en', otherLabel: 'English', otherShort: 'EN',
    game: 'Fluffytail: Sincap Macerası', gameHtml: 'Fluffytail: <span class="serif">Sincap Macerası</span>',
    skip: 'İçeriğe geç', home: 'Moon Arc Works ana sayfa', nav: { game: 'Oyun', privacy: 'Gizlilik', support: 'Destek' },
    foot: { studio: 'Moon Arc Works', contact: 'İletişim' },
    pages: {
      game: {
        title: 'Fluffytail: Sincap Macerası – çocuklar için 3D macera | Moon Arc Works',
        desc: '6–8 yaş çocuklar için 3D sincap macerası: beş dünyada koş, tırman, süzül ve Fıstık\'ı eve getir. Reklam yok, takip yok, internetsiz oynanır. Yakında iPhone, iPad ve Android\'de.',
      },
      privacy: {
        title: 'Gizlilik Politikası – Fluffytail: Sincap Macerası | Moon Arc Works',
        desc: 'Fluffytail: Sincap Macerası hiçbir kişisel veri toplamaz: reklam yok, analiz yok, takip yok, hesap yok. Kayıtlar cihazda kalır.',
      },
      support: {
        title: 'Destek – Fluffytail: Sincap Macerası | Moon Arc Works',
        desc: 'Ebeveynler için yardım: Tam Macera\'yı geri yükleme, Aile Paylaşımı, kaydı silme, diller ve cihaz gereksinimleri.',
      },
    },
  },
};

const mail = `<a href="mailto:${MAIL}">${MAIL}</a>`;

/* ----- Game page ----- */
const gameBody = {
  en: (p) => `
  <div class="hero">
    <img class="icon" src="/assets/fluffytail-icon.png" alt="Fluffytail icon: a laughing squirrel" width="128" height="128">
    <div>
      <p class="kicker">A 3D adventure for kids aged 6–8</p>
      <h1>${T.en.gameHtml}</h1>
      <p class="lead">One stormy night, Redtail the fox steals the golden acorns and carries little Peanut away in his sack. Run, climb, double jump and glide on your fluffy tail through five worlds, all the way to the Moon, to bring your sister home.</p>
      <!-- Store buttons: coming soon. Replace each <span> with a link to the store page when the game is out. -->
      <div class="actions">
        <span class="btn btn-ghost soon" aria-disabled="true">${APPLE_SVG}<span>App Store <small>· coming soon</small></span></span>
        <span class="btn btn-ghost soon" aria-disabled="true">${PLAY_SVG}<span>Google Play <small>· coming soon</small></span></span>
      </div>
    </div>
  </div>

  <!-- PLACEHOLDER: screenshots (landscape). Replace each figure with <img src="..." alt="..." width="1920" height="1080" loading="lazy">. -->
  <div class="shots" aria-label="Screenshots, coming soon" role="group">
    <div class="shot-ph">Screenshot coming soon</div>
    <div class="shot-ph">Screenshot coming soon</div>
    <div class="shot-ph">Screenshot coming soon</div>
  </div>

  <h2>What's inside</h2>
  <div class="tiles">
    <div class="tile"><h3>Five worlds, sixteen chapters</h3><p>The hazelnut hills, the Winter Land, a sunny island, Baron Magpie's city of rooftops and, at last, a rocket ride to the Moon. Every chapter opens like a page of a storybook.</p></div>
    <div class="tile"><h3>Friendly fights</h3><p>Bosses with their own tricks, and nobody gets hurt: beaten foes get dizzy and run off, and many become friends. Out of hearts? Carry on from the last checkpoint.</p></div>
    <div class="tile"><h3>Bring the little ones home</h3><p>Penguin chicks, owlets, turtle hatchlings, kittens and bunnies are lost. Find them and they waddle after you, all the way home to their mom.</p></div>
    <div class="tile"><h3>Never stuck</h3><p>A little bluebird flies over to show the way when a puzzle takes too long, and an arrow always points to the next goal. Easy controls made for small hands.</p></div>
  </div>

  <h2>For parents</h2>
  <ul class="checks">
    <li>No ads, no tracking, no accounts, no chat</li>
    <li>Collects no personal data</li>
    <li>Works offline</li>
    <li>Lots of pictures, few words, in 34 languages</li>
    <li>The first two chapters are free</li>
    <li>One single purchase unlocks the Full Adventure; no subscription</li>
    <li>Buying sits behind a grown-up question</li>
    <li>iPhone, iPad and Android</li>
  </ul>

  <div class="links">
    <a class="btn btn-gold" href="${p.privacy}">Privacy policy</a>
    <a class="btn btn-ghost" href="${p.support}">Support and FAQ</a>
  </div>`,
  tr: (p) => `
  <div class="hero">
    <img class="icon" src="/assets/fluffytail-icon.png" alt="Fluffytail ikonu: gülen bir sincap" width="128" height="128">
    <div>
      <p class="kicker">6–8 yaş çocuklar için 3D macera</p>
      <h1>${T.tr.gameHtml}</h1>
      <p class="lead">Fırtınalı bir gece Kızılkuyruk adlı tilki altın palamutları çalar ve minik Fıstık'ı çuvalına koyup kaçırır. Kardeşini eve getirmek için beş dünyada, Ay'a kadar koş, tırman, takla atarak çift zıpla ve kabarık kuyruğunla süzül.</p>
      <!-- Mağaza düğmeleri: yakında. Oyun çıkınca her <span>'i mağaza sayfasına giden bir bağlantıyla değiştir. -->
      <div class="actions">
        <span class="btn btn-ghost soon" aria-disabled="true">${APPLE_SVG}<span>App Store <small>· yakında</small></span></span>
        <span class="btn btn-ghost soon" aria-disabled="true">${PLAY_SVG}<span>Google Play <small>· yakında</small></span></span>
      </div>
    </div>
  </div>

  <!-- PLACEHOLDER: ekran görüntüleri (yatay). Her kutuyu <img src="..." alt="..." width="1920" height="1080" loading="lazy"> ile değiştir. -->
  <div class="shots" aria-label="Ekran görüntüleri, yakında" role="group">
    <div class="shot-ph">Ekran görüntüsü yakında</div>
    <div class="shot-ph">Ekran görüntüsü yakında</div>
    <div class="shot-ph">Ekran görüntüsü yakında</div>
  </div>

  <h2>İçinde neler var</h2>
  <div class="tiles">
    <div class="tile"><h3>Beş dünya, on altı bölüm</h3><p>Fındık tepeleri, Kış Diyarı, güneşli bir ada, Saksağan Baron'un çatılarla dolu şehri ve en sonunda roketle Ay'a yolculuk. Her bölüm bir masal kitabının sayfası gibi açılır.</p></div>
    <div class="tile"><h3>Tatlı dövüşler</h3><p>Kendi numaraları olan bosslar var ama kimse incinmez: yenilenler sersemleyip kaçar, çoğu dost olur. Canların biterse son kontrol noktasından devam edersin.</p></div>
    <div class="tile"><h3>Yavruları eve getir</h3><p>Penguen, baykuş ve kaplumbağa yavruları, kedi yavruları ve tavşanlar kaybolmuş. Onları bul, peşine takılıp annelerine kadar seninle gelsinler.</p></div>
    <div class="tile"><h3>Hiç takılma</h3><p>Bir bulmaca uzun sürerse küçük mavi bir kuş gelip yolu gösterir, ekrandaki işaret de hep bir sonraki hedefi gösterir. Küçük eller için kolay kontroller.</p></div>
  </div>

  <h2>Ebeveynler için</h2>
  <ul class="checks">
    <li>Reklam yok, takip yok, hesap yok, sohbet yok</li>
    <li>Hiçbir kişisel veri toplamaz</li>
    <li>İnternetsiz oynanır</li>
    <li>Bol resim, az yazı, 34 dilde</li>
    <li>İlk iki bölüm ücretsiz</li>
    <li>Tek bir satın alma Tam Macera'yı açar; abonelik yok</li>
    <li>Satın alma ebeveyn sorusunun arkasında</li>
    <li>iPhone, iPad ve Android</li>
  </ul>

  <div class="links">
    <a class="btn btn-gold" href="${p.privacy}">Gizlilik politikası</a>
    <a class="btn btn-ghost" href="${p.support}">Destek ve sık sorulanlar</a>
  </div>`,
};

/* ----- Privacy policy ----- */
// Written against Apple guidelines 1.3 and 5.1.1(i)/5.1.4 and Google Play's User Data and Families policies:
// what is collected (nothing) and how, all uses, third parties and equal protection, retention and deletion,
// how to revoke consent or ask for deletion, developer name and privacy contact, children's laws (COPPA, GDPR, KVKK).
const privacyBody = {
  en: (p) => `
  <p class="kicker">${T.en.game}</p>
  <h1>Privacy Policy</h1>
  <p class="updated">Last updated: <time datetime="${UPDATED.iso}">${UPDATED.en}</time></p>

  <div class="box">
    <h2>In short</h2>
    <ul>
      <li>The game collects <strong>no personal data</strong> from anyone, children included.</li>
      <li>No ads, no analytics, no tracking, no accounts and no chat. The game does not connect to the internet.</li>
      <li>Progress and settings are saved only on your device, and you can delete them at any time.</li>
      <li>The one optional purchase is handled by Apple or Google. We never see any payment details.</li>
    </ul>
  </div>

  <h2>Who we are</h2>
  <p><strong>${T.en.game}</strong> (in Turkish <span lang="tr">Fluffytail: Sincap Macerası</span>; "the game") is made by <strong>Moon Arc Works</strong>, an independent studio ("we", "us"). This policy covers the game on iPhone, iPad and Android, and these web pages. For anything about privacy, write to ${mail}.</p>

  <h2>What the game collects</h2>
  <p><strong>Nothing.</strong> The game does not collect, store on our side, use, share or sell any personal data. In particular it:</p>
  <ul>
    <li>never asks for a name, age, birthday, e-mail address, phone number, photo, voice or location, and has no place to type them;</li>
    <li>has no accounts, no sign-in, no chat, no friends list, no leaderboards and no way to share anything with other players;</li>
    <li>shows no ads and contains no advertising, analytics, crash-reporting, social-media or tracking software (SDKs) from anyone;</li>
    <li>does not read the advertising identifier (IDFA or Android advertising ID) or any other device identifier;</li>
    <li>does not connect to the internet: it sends nothing to us or to anyone else. The Android version does not even ask for the internet permission.</li>
  </ul>

  <h2>What stays on your device</h2>
  <p>To let your child carry on where they left off, the game saves a few things in its own private storage on the device:</p>
  <ul>
    <li>progress: chapters reached, golden acorns, stars, costumes and stickers;</li>
    <li>settings: music and sound volume, vibration and language;</li>
    <li>whether the Full Adventure is unlocked;</li>
    <li>pictures taken with the game's photo mode. They stay inside the game; they are not added to your photo library.</li>
  </ul>
  <p>None of this is sent to us or to anyone else, and none of it identifies your child. On iPhone and iPad, if you use iCloud Backup or back up to a computer, Apple's backup may include the game's save under your own account; we have no access to it. The Android version is excluded from Google's app backup.</p>

  <h2>How long data is kept and how to delete it</h2>
  <p>Saves stay on the device until you delete them. We keep nothing about you or your child, because nothing reaches us.</p>
  <ul>
    <li><strong>Start over:</strong> on the main menu, tap the gear (Settings), then the bin (Delete save), and answer the grown-up question. This erases all progress. The Full Adventure stays unlocked.</li>
    <li><strong>Delete everything:</strong> delete the game from the device. This removes the save, the settings and any photo-mode pictures. A purchase is never lost: it stays with your Apple ID or Google account and can be restored (see <a href="${p.support}">Support</a>).</li>
  </ul>
  <p>Since the game collects no personal data, there is no consent to give or take back. If you have ever e-mailed us, you can ask us to delete those messages at any time (see below).</p>

  <h2>Purchases</h2>
  <p>The first two chapters are free. One optional, one-time purchase, the Full Adventure, unlocks the rest. It is made through Apple's App Store or Google Play, and buying or restoring it first asks a grown-up question. Apple or Google handle the payment under their own privacy policies (<a href="https://www.apple.com/legal/privacy/">Apple</a>, <a href="https://policies.google.com/privacy">Google</a>). We never see your name, account, card or any other payment details; the game only learns from the store on the device whether the Full Adventure has been bought. Apple and Google send us sales reports that do not identify you.</p>

  <h2>Third parties</h2>
  <p>We do not share, sell or rent any data, and no third party receives data about you or your child from the game. The game is built with the open-source Godot engine and an open-source purchase library that only talks to the App Store or Google Play on the device; neither sends anything to us or to anyone else. Should this ever change, any partner would have to protect data at least as well as this policy and the Apple and Google rules for children's apps require, and we would update this policy and the store privacy labels first.</p>
  <p>If you have turned on sharing with app developers in your device's settings, Apple or Google may show us anonymous crash and performance reports (for example the device model, the system version and where the game stopped). Apple and Google collect these under their own policies; they do not identify you or your child, and we use them only to fix bugs. You can turn this off at any time: on iPhone and iPad in Settings › Privacy &amp; Security › Analytics &amp; Improvements, and on Android in your device's usage and diagnostics settings.</p>

  <h2>Children's privacy</h2>
  <p>Fluffytail is made for children aged 6 to 8 and is meant for the App Store's Kids Category and Google Play's Families programme. We follow the US Children's Online Privacy Protection Act (COPPA), the EU and UK GDPR rules for children's data, and similar laws such as Türkiye's KVKK. Because the game collects no personal information, it never needs to ask a child or a parent for personal details or consent.</p>
  <p>A child cannot type in personal details, share pictures, talk to other players or leave the game by tapping a link. Buying, restoring a purchase, deleting the save and anything that leads out of the game sit behind a grown-up question (a multiplication meant for adults).</p>

  <h2>If you write to us</h2>
  <p>If you e-mail us, we receive your e-mail address and whatever you write. We use it only to answer you; we never add you to a mailing list or share your message. Our e-mail reaches us through our providers, Cloudflare (which forwards mail sent to our address) and Google (which hosts the mailbox), each under its own privacy policy. We delete support conversations when they are no longer needed, at the latest 12 months after the last message, and sooner if you ask. Children: please ask a grown-up to write to us for you.</p>

  <h2>Your rights</h2>
  <p>Depending on where you live (for example under the GDPR, the UK GDPR, KVKK, COPPA or US state laws), you or your child's parent or guardian may ask what personal data we hold, have it corrected or deleted, object to its use or ask for a copy. For the game the answer is simple: we hold none. For e-mails you sent us, write to ${mail} and we will reply within 30 days. You can also complain to your local data protection authority.</p>

  <h2>Security</h2>
  <p>Saves are kept in the game's private storage, which the operating system shields from other apps. Payments run through Apple's and Google's own secure systems, and our e-mail travels over encrypted connections.</p>

  <h2>These web pages</h2>
  <p>moonarcworks.com uses no cookies, no analytics, no trackers and no third-party scripts. It is hosted on GitHub Pages and delivered through Cloudflare; like any web server, they may keep short-lived technical logs, such as IP addresses, to keep the site secure and running. The studio home page remembers which language you picked in your own browser; that never leaves your device.</p>

  <h2>Changes to this policy</h2>
  <p>If we change this policy, we will update this page and the date at the top. If we ever wanted the game to collect any data, we would change this policy and the store privacy labels before that update reached you, and ask for a parent's verifiable consent wherever the law requires it.</p>

  <h2>Contact</h2>
  <p>Moon Arc Works<br>${mail}</p>`,
  tr: (p) => `
  <p class="kicker"><span lang="en">Fluffytail</span>: Sincap Macerası</p>
  <h1>Gizlilik Politikası</h1>
  <p class="updated">Son güncelleme: <time datetime="${UPDATED.iso}">${UPDATED.tr}</time></p>

  <div class="box">
    <h2>Kısaca</h2>
    <ul>
      <li>Oyun, çocuklar dahil hiç kimseden <strong>hiçbir kişisel veri toplamaz</strong>.</li>
      <li>Reklam, analiz, takip, hesap ve sohbet yok. Oyun internete bağlanmaz.</li>
      <li>İlerleme ve ayarlar yalnızca cihazında saklanır; istediğin zaman silebilirsin.</li>
      <li>İsteğe bağlı tek satın almayı Apple ya da Google yapar. Ödeme bilgilerini hiçbir zaman görmeyiz.</li>
    </ul>
  </div>

  <h2>Biz kimiz</h2>
  <p><strong>${T.tr.game}</strong> (İngilizcesi <span lang="en">Fluffytail: Squirrel Adventure</span>; "oyun"), bağımsız bir stüdyo olan <strong>Moon Arc Works</strong> ("biz") tarafından yapılır. Bu politika oyunun iPhone, iPad ve Android sürümlerini ve bu web sayfalarını kapsar. Gizlilikle ilgili her konuda bize ${mail} adresinden yazabilirsin.</p>

  <h2>Oyun neleri toplar</h2>
  <p><strong>Hiçbir şey.</strong> Oyun hiçbir kişisel veriyi toplamaz, bizim tarafımızda saklamaz, kullanmaz, paylaşmaz ya da satmaz. Özellikle:</p>
  <ul>
    <li>ad, yaş, doğum tarihi, e-posta, telefon numarası, fotoğraf, ses ya da konum sormaz; bunları yazacak bir yeri de yoktur;</li>
    <li>hesap, giriş, sohbet, arkadaş listesi, skor tablosu ya da başka oyuncularla bir şey paylaşma yolu yoktur;</li>
    <li>reklam göstermez; hiçbir şirketin reklam, analiz, hata raporlama, sosyal medya ya da takip yazılımını (SDK) içermez;</li>
    <li>reklam kimliğini (IDFA ya da Android reklam kimliği) veya başka bir cihaz kimliğini okumaz;</li>
    <li>internete bağlanmaz; ne bize ne de başka birine bir şey gönderir. Android sürümü internet izni bile istemez.</li>
  </ul>

  <h2>Cihazında kalanlar</h2>
  <p>Çocuğun kaldığı yerden devam edebilsin diye oyun birkaç şeyi cihazdaki kendi özel alanına kaydeder:</p>
  <ul>
    <li>ilerleme: açılan bölümler, altın palamutlar, yıldızlar, kostümler ve çıkartmalar;</li>
    <li>ayarlar: müzik ve ses düzeyi, titreşim ve dil;</li>
    <li>Tam Macera'nın açık olup olmadığı;</li>
    <li>oyunun fotoğraf modunda çekilen resimler. Bunlar oyunun içinde kalır, fotoğraf arşivine eklenmez.</li>
  </ul>
  <p>Bunların hiçbiri bize ya da başka birine gönderilmez ve hiçbiri çocuğunun kim olduğunu göstermez. iPhone ve iPad'de iCloud Yedekleme kullanıyorsan ya da bilgisayara yedek alıyorsan, Apple'ın yedeği oyun kaydını senin hesabın altında içerebilir; biz buna erişemeyiz. Android sürümü Google'ın uygulama yedeklemesinin dışında tutulur.</p>

  <h2>Veriler ne kadar kalır, nasıl silinir</h2>
  <p>Kayıtlar sen silene kadar cihazda kalır. Bizde senin ya da çocuğunun hakkında hiçbir bilgi tutulmaz, çünkü bize hiçbir şey ulaşmaz.</p>
  <ul>
    <li><strong>Baştan başlamak:</strong> ana menüde dişliye (Ayarlar), sonra çöp kutusuna (Kaydı sil) dokun ve ebeveyn sorusunu cevapla. Bu bütün ilerlemeyi siler. Tam Macera açık kalır.</li>
    <li><strong>Her şeyi silmek:</strong> oyunu cihazdan sil. Bu kaydı, ayarları ve fotoğraf modu resimlerini kaldırır. Satın alma hiçbir zaman kaybolmaz: Apple kimliğinde ya da Google hesabında kalır ve geri yüklenebilir (bkz. <a href="${p.support}">Destek</a>).</li>
  </ul>
  <p>Oyun kişisel veri toplamadığı için verilecek ya da geri alınacak bir onay yoktur. Bize daha önce e-posta yazdıysan, bu mesajların silinmesini istediğin zaman isteyebilirsin (aşağıya bak).</p>

  <h2>Satın almalar</h2>
  <p>İlk iki bölüm ücretsizdir. İsteğe bağlı, tek seferlik bir satın alma olan Tam Macera geri kalanını açar. Satın alma Apple'ın App Store'u ya da Google Play üzerinden yapılır; satın almadan ya da geri yüklemeden önce bir ebeveyn sorusu çıkar. Ödemeyi Apple ya da Google kendi gizlilik politikalarına göre işler (<a href="https://www.apple.com/tr/legal/privacy/">Apple</a>, <a href="https://policies.google.com/privacy?hl=tr">Google</a>). Adını, hesabını, kartını ya da başka bir ödeme bilgisini hiçbir zaman görmeyiz; oyun yalnızca cihazdaki mağazadan Tam Macera'nın alınıp alınmadığını öğrenir. Apple ve Google bize kim olduğunu göstermeyen satış raporları gönderir.</p>

  <h2>Üçüncü taraflar</h2>
  <p>Hiçbir veriyi paylaşmayız, satmayız ya da kiralamayız; oyundan hiçbir üçüncü tarafa senin ya da çocuğunun hakkında veri gitmez. Oyun açık kaynaklı Godot motoruyla ve yalnızca cihazdaki App Store ya da Google Play ile konuşan açık kaynaklı bir satın alma kütüphanesiyle yapılmıştır; ikisi de ne bize ne başkasına bir şey gönderir. Bu bir gün değişirse, her iş ortağının verileri en az bu politikanın ve Apple ile Google'ın çocuk uygulamaları kurallarının istediği kadar koruması gerekir; önce bu politikayı ve mağazalardaki gizlilik bilgilerini güncelleriz.</p>
  <p>Cihaz ayarlarında uygulama geliştiricileriyle paylaşımı açtıysan, Apple ya da Google bize anonim çökme ve performans raporları gösterebilir (örneğin cihaz modeli, sistem sürümü ve oyunun nerede durduğu). Bunları Apple ve Google kendi politikalarına göre toplar; senin ya da çocuğunun kim olduğunu göstermez ve biz yalnızca hataları düzeltmek için kullanırız. İstediğin zaman kapatabilirsin: iPhone ve iPad'de Ayarlar › Gizlilik ve Güvenlik › Analiz ve İyileştirmeler'den, Android'de cihazın kullanım ve teşhis ayarlarından.</p>

  <h2>Çocukların gizliliği</h2>
  <p>Fluffytail 6–8 yaş çocuklar için yapılmıştır; App Store'un Çocuklar kategorisi ve Google Play'in Aile programı için hazırlanmıştır. ABD'nin Çocukların Çevrimiçi Gizliliğini Koruma Yasası'na (COPPA), AB ve Birleşik Krallık GDPR'ının çocuk verileri kurallarına ve Türkiye'deki KVKK gibi benzer yasalara uyarız. Oyun kişisel bilgi toplamadığı için ne çocuktan ne de ebeveynden kişisel bilgi ya da onay istemesi gerekir.</p>
  <p>Çocuk kişisel bilgi yazamaz, resim paylaşamaz, başka oyuncularla konuşamaz ve bir bağlantıya dokunarak oyundan çıkamaz. Satın alma, satın alımı geri yükleme, kaydı silme ve oyunun dışına götüren her şey bir ebeveyn sorusunun (yetişkinler için bir çarpma işlemi) arkasındadır.</p>

  <h2>Bize yazarsan</h2>
  <p>Bize e-posta gönderirsen e-posta adresin ve yazdıkların bize ulaşır. Bunları yalnızca sana cevap vermek için kullanırız; seni hiçbir listeye eklemeyiz, mesajını kimseyle paylaşmayız. E-postalarımız bize hizmet sağlayıcılarımız üzerinden ulaşır: Cloudflare adresimize gelen postayı yönlendirir, Google posta kutusunu barındırır; her biri kendi gizlilik politikasına göre çalışır. Destek yazışmalarını artık gerekmediğinde, en geç son mesajdan 12 ay sonra, istersen daha önce sileriz. Çocuklar: lütfen bize senin yerine bir büyüğün yazsın.</p>

  <h2>Hakların</h2>
  <p>Yaşadığın yere göre (örneğin KVKK, GDPR, Birleşik Krallık GDPR'ı, COPPA ya da ABD eyalet yasaları kapsamında) sen ya da çocuğunun ebeveyni veya vasisi, hakkınızda hangi kişisel verileri tuttuğumuzu sorabilir, düzeltilmesini ya da silinmesini isteyebilir, kullanılmasına itiraz edebilir ya da bir kopyasını isteyebilir. Oyun için cevap basit: hiçbir veri tutmuyoruz. Bize gönderdiğin e-postalar için ${mail} adresine yaz; 30 gün içinde cevap veririz. Bulunduğun ülkenin veri koruma kurumuna (Türkiye'de Kişisel Verileri Koruma Kurumu) şikâyette de bulunabilirsin.</p>

  <h2>Güvenlik</h2>
  <p>Kayıtlar oyunun, işletim sisteminin diğer uygulamalardan koruduğu özel alanında tutulur. Ödemeler Apple'ın ve Google'ın kendi güvenli sistemlerinden geçer; e-postalarımız şifreli bağlantılarla iletilir.</p>

  <h2>Bu web sayfaları</h2>
  <p>moonarcworks.com çerez, analiz, takip ya da üçüncü taraf betiği kullanmaz. Site GitHub Pages'te barındırılır ve Cloudflare üzerinden sunulur; her web sunucusu gibi bunlar da siteyi güvenli ve çalışır tutmak için IP adresi gibi kısa ömürlü teknik kayıtlar tutabilir. Stüdyo ana sayfası seçtiğin dili kendi tarayıcında hatırlar; bu bilgi cihazından çıkmaz.</p>

  <h2>Bu politikadaki değişiklikler</h2>
  <p>Bu politikayı değiştirirsek bu sayfayı ve üstteki tarihi güncelleriz. Oyunun bir gün herhangi bir veri toplaması gerekirse, o güncelleme sana ulaşmadan önce bu politikayı ve mağazalardaki gizlilik bilgilerini değiştirir, yasanın gerektirdiği her yerde ebeveynin doğrulanabilir onayını isteriz.</p>

  <h2>İletişim</h2>
  <p>Moon Arc Works<br>${mail}</p>`,
};

/* ----- Support ----- */
const supportBody = {
  en: (p) => `
  <p class="kicker">${T.en.game}</p>
  <h1>Support</h1>
  <p class="lead">Need a hand? Write to us; we read every message and usually reply within a few days.</p>
  <div class="actions"><a class="btn btn-gold" href="mailto:${MAIL}?subject=Fluffytail">${MAIL}</a></div>
  <p class="muted">It helps to tell us your device (for example iPhone 13 or Galaxy Tab A8), its system version and what happened. Please don't send personal details we don't need. Children: ask a grown-up to write for you.</p>

  <h2>Questions from parents</h2>

  <details>
    <summary>How do I restore the Full Adventure?</summary>
    <div>
      <p>The game checks the store when it starts, so on a new device or after reinstalling, the Full Adventure usually comes back by itself. If it doesn't:</p>
      <ol>
        <li>Make sure the device is signed in with the same Apple ID or Google account that bought it, and is online.</li>
        <li>Open the game, tap the gear on the main menu (Settings), then the round arrow (Restore purchase).</li>
        <li>Answer the grown-up question.</li>
      </ol>
      <p>Still locked? Write to us with the store receipt date (no card details, please).</p>
    </div>
  </details>

  <details>
    <summary>Can the whole family use one purchase?</summary>
    <div>
      <p><strong>iPhone and iPad:</strong> yes. The Full Adventure supports Apple's Family Sharing, so family members in your Family Sharing group can restore it on their own devices with their own Apple ID, as long as purchase sharing is turned on.</p>
      <p><strong>Android:</strong> Google Play does not share in-app purchases through Family Library. The purchase works on every Android device signed in with the Google account that bought it.</p>
    </div>
  </details>

  <details>
    <summary>What does the Full Adventure include? Is there a subscription?</summary>
    <div>
      <p>The first two chapters are free. One single, one-time purchase unlocks the Full Adventure: chapters 3 to 16, with the Winter Land, the island, the city and the Moon. There is no subscription and nothing else to buy. The price is shown in the store in your currency, and payment is charged to your Apple or Google account.</p>
    </div>
  </details>

  <details>
    <summary>How do I stop my child buying by accident?</summary>
    <div>
      <p>Every purchase and restore first asks a grown-up question (a multiplication). You can also turn on Ask to Buy (Apple Family Sharing) or purchase approvals in Google Family Link, or require a password for purchases in the App Store or Google Play settings.</p>
    </div>
  </details>

  <details>
    <summary>How do I get a refund?</summary>
    <div>
      <p>Payments are made to Apple or Google, so refunds are handled by them: on iPhone and iPad at <a href="https://reportaproblem.apple.com/">reportaproblem.apple.com</a>, on Android from your order history in Google Play (<a href="https://support.google.com/googleplay/answer/2479637">Google's refund help</a>). We can't refund purchases ourselves, but we are happy to help if something went wrong.</p>
    </div>
  </details>

  <details>
    <summary>How do I delete the save and start over?</summary>
    <div>
      <p>On the main menu, tap the gear (Settings), then the bin (Delete save), and answer the grown-up question. All progress is erased and the game starts from the beginning. The Full Adventure stays unlocked. Deleting the game from the device removes everything it saved.</p>
    </div>
  </details>

  <details>
    <summary>Does it need the internet?</summary>
    <div>
      <p>No. The game plays fully offline, on a plane or in the car. Only buying or restoring the Full Adventure needs a connection to the App Store or Google Play.</p>
    </div>
  </details>

  <details>
    <summary>Which languages does it speak?</summary>
    <div>
      <p>34 languages. The game starts in your device's language; to change it, tap the gear (Settings) and then the globe.</p>
      <p class="langs">${langList}</p>
    </div>
  </details>

  <details>
    <summary>Which devices does it run on?</summary>
    <div>
      <ul>
        <li><strong>iPhone and iPad</strong> with iOS or iPadOS 17 or later.</li>
        <li><strong>Android</strong> phones and tablets with Android 10 or later and a 64-bit processor.</li>
      </ul>
      <p>It is a 3D game, so newer devices run it more smoothly. It is played in landscape.</p>
    </div>
  </details>

  <details>
    <summary>Are there ads? Does the game collect data?</summary>
    <div>
      <p>No ads, no tracking, no accounts and no chat, and the game collects no personal data. Saves stay on the device. Read the full <a href="${p.privacy}">privacy policy</a>.</p>
    </div>
  </details>

  <details>
    <summary>My child is stuck. What now?</summary>
    <div>
      <p>If a puzzle takes too long, a little bluebird flies over to show the way, and an arrow on screen always points to the next goal. Running out of hearts is fine too: the game carries on from the last checkpoint.</p>
    </div>
  </details>

  <div class="links">
    <a class="btn btn-ghost" href="${p.game}">About the game</a>
    <a class="btn btn-ghost" href="${p.privacy}">Privacy policy</a>
  </div>`,
  tr: (p) => `
  <p class="kicker"><span lang="en">Fluffytail</span>: Sincap Macerası</p>
  <h1>Destek</h1>
  <p class="lead">Yardım mı lazım? Bize yaz; her mesajı okuyoruz ve genellikle birkaç gün içinde cevap veriyoruz.</p>
  <div class="actions"><a class="btn btn-gold" href="mailto:${MAIL}?subject=Fluffytail">${MAIL}</a></div>
  <p class="muted">Cihazını (örneğin iPhone 13 ya da Galaxy Tab A8), sistem sürümünü ve ne olduğunu yazarsan işimiz kolaylaşır. Lütfen gerekmeyen kişisel bilgileri gönderme. Çocuklar: bize senin yerine bir büyüğün yazsın.</p>

  <h2>Ebeveynlerden gelen sorular</h2>

  <details>
    <summary>Tam Macera'yı nasıl geri yüklerim?</summary>
    <div>
      <p>Oyun açılırken mağazaya bakar; yeni bir cihazda ya da yeniden yükledikten sonra Tam Macera genellikle kendiliğinden geri gelir. Gelmezse:</p>
      <ol>
        <li>Cihazda satın almayı yapan Apple kimliği ya da Google hesabıyla oturum açık olsun ve internete bağlı olsun.</li>
        <li>Oyunu aç, ana menüde dişliye (Ayarlar), sonra yuvarlak oka (Satın alımı geri yükle) dokun.</li>
        <li>Ebeveyn sorusunu cevapla.</li>
      </ol>
      <p>Hâlâ kilitli mi? Mağaza makbuzunun tarihiyle bize yaz (lütfen kart bilgisi gönderme).</p>
    </div>
  </details>

  <details>
    <summary>Bütün aile tek satın almayı kullanabilir mi?</summary>
    <div>
      <p><strong>iPhone ve iPad:</strong> evet. Tam Macera Apple'ın Aile Paylaşımı'nı destekler; satın alma paylaşımı açıksa Aile Paylaşımı grubundaki aile üyeleri kendi Apple kimlikleriyle kendi cihazlarında geri yükleyebilir.</p>
      <p><strong>Android:</strong> Google Play uygulama içi satın almaları Aile Kitaplığı ile paylaşmaz. Satın alma, onu yapan Google hesabıyla oturum açılmış her Android cihazda çalışır.</p>
    </div>
  </details>

  <details>
    <summary>Tam Macera'da neler var? Abonelik var mı?</summary>
    <div>
      <p>İlk iki bölüm ücretsiz. Tek seferlik tek bir satın alma Tam Macera'yı açar: Kış Diyarı, ada, şehir ve Ay'la birlikte 3-16. bölümler. Abonelik yok, başka satın alınacak bir şey yok. Fiyat mağazada kendi para biriminle görünür; ödeme Apple ya da Google hesabından alınır.</p>
    </div>
  </details>

  <details>
    <summary>Çocuğumun yanlışlıkla satın almasını nasıl önlerim?</summary>
    <div>
      <p>Her satın alma ve geri yüklemeden önce bir ebeveyn sorusu (çarpma işlemi) çıkar. Ayrıca Apple Aile Paylaşımı'nda Satın Alma İzni'ni ya da Google Family Link'te satın alma onayını açabilir, App Store veya Google Play ayarlarında satın almalar için şifre isteyebilirsin.</p>
    </div>
  </details>

  <details>
    <summary>Nasıl para iadesi alırım?</summary>
    <div>
      <p>Ödeme Apple'a ya da Google'a yapıldığı için iadeyi onlar yapar: iPhone ve iPad'de <a href="https://reportaproblem.apple.com/">reportaproblem.apple.com</a> adresinden, Android'de Google Play'deki sipariş geçmişinden (<a href="https://support.google.com/googleplay/answer/2479637?hl=tr">Google'ın iade yardımı</a>). İadeyi biz yapamıyoruz ama bir sorun olduysa yardım etmekten memnun oluruz.</p>
    </div>
  </details>

  <details>
    <summary>Kaydı nasıl silip baştan başlarım?</summary>
    <div>
      <p>Ana menüde dişliye (Ayarlar), sonra çöp kutusuna (Kaydı sil) dokun ve ebeveyn sorusunu cevapla. Bütün ilerleme silinir ve oyun en baştan başlar. Tam Macera açık kalır. Oyunu cihazdan silmek, kaydettiği her şeyi kaldırır.</p>
    </div>
  </details>

  <details>
    <summary>İnternet gerekiyor mu?</summary>
    <div>
      <p>Hayır. Oyun uçakta ya da arabada, tamamen internetsiz oynanır. Yalnızca Tam Macera'yı satın almak ya da geri yüklemek için App Store veya Google Play bağlantısı gerekir.</p>
    </div>
  </details>

  <details>
    <summary>Hangi dilleri konuşuyor?</summary>
    <div>
      <p>34 dil. Oyun cihazının diliyle açılır; değiştirmek için dişliye (Ayarlar), sonra dünyaya dokun.</p>
      <p class="langs">${langList}</p>
    </div>
  </details>

  <details>
    <summary>Hangi cihazlarda çalışır?</summary>
    <div>
      <ul>
        <li>iOS ya da iPadOS 17 veya sonrası yüklü <strong>iPhone ve iPad</strong>.</li>
        <li>Android 10 veya sonrası yüklü, 64 bit işlemcili <strong>Android</strong> telefon ve tabletler.</li>
      </ul>
      <p>3D bir oyun olduğu için yeni cihazlarda daha akıcı çalışır. Yatay oynanır.</p>
    </div>
  </details>

  <details>
    <summary>Reklam var mı? Oyun veri topluyor mu?</summary>
    <div>
      <p>Reklam, takip, hesap ve sohbet yok; oyun hiçbir kişisel veri toplamaz. Kayıtlar cihazda kalır. <a href="${p.privacy}">Gizlilik politikasının</a> tamamını oku.</p>
    </div>
  </details>

  <details>
    <summary>Çocuğum bir yerde takıldı. Ne yapmalı?</summary>
    <div>
      <p>Bir bulmaca uzun sürerse küçük mavi bir kuş uçup gelir ve yolu gösterir; ekrandaki işaret de hep bir sonraki hedefi gösterir. Canların bitmesi de dert değil: oyun son kontrol noktasından devam eder.</p>
    </div>
  </details>

  <div class="links">
    <a class="btn btn-ghost" href="${p.game}">Oyun hakkında</a>
    <a class="btn btn-ghost" href="${p.privacy}">Gizlilik politikası</a>
  </div>`,
};

/* ---------------------------------------------------------------- pages ---------------------------------------------------------------- */

const PAGES = { game: '/fluffytail/', privacy: '/fluffytail/privacy/', support: '/fluffytail/support/' };
const BODIES = { game: gameBody, privacy: privacyBody, support: supportBody };
const urlFor = (lang, key) => T[lang].base + PAGES[key];

function jsonLd(lang, key) {
  const t = T[lang], url = SITE + urlFor(lang, key);
  if (key !== 'game') {
    return { '@context': 'https://schema.org', '@type': 'WebPage', name: t.pages[key].title, url, inLanguage: lang,
      ...(key === 'privacy' ? { dateModified: UPDATED.iso } : {}),
      about: { '@id': SITE + '/fluffytail/#game' }, publisher: { '@id': SITE + '/#org' } };
  }
  return { '@context': 'https://schema.org', '@type': ['VideoGame', 'MobileApplication'], '@id': SITE + '/fluffytail/#game',
    name: T.en.game, alternateName: T.tr.game, url, description: t.pages.game.desc, inLanguage: LANGS.map(([c]) => c),
    operatingSystem: 'iOS 17, iPadOS 17, Android 10', applicationCategory: 'GameApplication', genre: ['Platformer', 'Adventure'],
    gamePlatform: ['iPhone', 'iPad', 'Android'], audience: { '@type': 'PeopleAudience', suggestedMinAge: 6, suggestedMaxAge: 8 },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free to start; one optional in-app purchase unlocks the Full Adventure.' },
    publisher: { '@id': SITE + '/#org' }, author: { '@type': 'Organization', '@id': SITE + '/#org', name: 'Moon Arc Works', url: SITE + '/', email: MAIL } };
}

function page(lang, key) {
  const t = T[lang], meta = t.pages[key];
  const links = Object.fromEntries(Object.keys(PAGES).map((k) => [k, urlFor(lang, k)]));
  const nav = Object.keys(PAGES).map((k) => `<a href="${links[k]}"${k === key ? ' aria-current="page"' : ''}>${t.nav[k]}</a>`).join('');
  const otherUrl = urlFor(t.other, key);
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${meta.title}</title>
<meta name="description" content="${meta.desc.replace(/"/g, '&quot;')}">
<meta name="theme-color" content="#070B1C">
<meta name="color-scheme" content="dark">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="canonical" href="${SITE}${urlFor(lang, key)}">
<link rel="alternate" hreflang="en" href="${SITE}${urlFor('en', key)}">
<link rel="alternate" hreflang="tr" href="${SITE}${urlFor('tr', key)}">
<link rel="alternate" hreflang="x-default" href="${SITE}${urlFor('en', key)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE}${urlFor(lang, key)}">
<meta property="og:title" content="${meta.title.split(' | ')[0]}">
<meta property="og:description" content="${meta.desc.replace(/"/g, '&quot;')}">
<meta property="og:locale" content="${t.locale}">
<meta property="og:site_name" content="Moon Arc Works">
<!-- PLACEHOLDER: swap for a Fluffytail share image (1200x630) once the art is picked. -->
<meta property="og:image" content="${SITE}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(jsonLd(lang, key))}</script>
<style>${CSS}</style>
</head>
<body>
<a class="skip" href="#main">${t.skip}</a>
<header>
  <div class="wrap">
    <a class="brand" href="${t.base}/" aria-label="${t.home}">${MARK_SVG}Moon Arc Works</a>
    <nav aria-label="${t.game}">${nav}<a class="lang" href="${otherUrl}" hreflang="${t.other}" lang="${t.other}" aria-label="${t.otherLabel}">${t.otherShort}</a></nav>
  </div>
</header>
<main id="main" class="wrap${key === 'game' ? '' : ' doc'}">
${BODIES[key][lang](links)}
</main>
<footer>
  <div class="wrap">
    <span>© 2026 Moon Arc Works</span>
    <nav aria-label="${lang === 'tr' ? 'Alt bilgi' : 'Footer'}"><a href="${t.base}/">${t.foot.studio}</a><a href="${links.game}">${t.game}</a><a href="${links.privacy}">${t.nav.privacy}</a><a href="${links.support}">${t.nav.support}</a><a href="mailto:${MAIL}">${t.foot.contact}</a></nav>
  </div>
</footer>
</body>
</html>
`;
}

// Writes the six pages and returns their sitemap entries as [url, {en, tr}] pairs.
export function writeFluffytail() {
  const entries = [];
  for (const key of Object.keys(PAGES)) {
    const alt = { en: SITE + urlFor('en', key), tr: SITE + urlFor('tr', key) };
    for (const lang of ['en', 'tr']) {
      const file = path.join('.', urlFor(lang, key), 'index.html');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, page(lang, key));
      entries.push([alt[lang], alt]);
    }
  }
  return entries;
}
