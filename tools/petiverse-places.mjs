// Petiverse "Yakındakiler" için dünya geneli hayvan mekânları (OpenStreetMap, ODbL), 5°×5° karolar halinde:
//   node tools/petiverse-places.mjs            → petiverse-places/v1/<lat>_<lon>.json + index.json
// Aylık GitHub Action çalıştırır (.github/workflows/petiverse-places.yml). Uygulama yalnızca kullanıcının
// çevresindeki karoları indirir (src/lib/placesRemote.ts); konum hiçbir yere gönderilmez.
// Kaldığı yerden devam eder: her karo ayrı sorgulanır ve hemen yazılır; ilerleme petiverse-places/state.json'da.
// Süre (DEADLINE_MIN) dolunca yeni sorgu açmaz, o ana kadarkini bırakır; Action commitleyip kendini yeniden başlatır.
// Tur bitince (tüm karolar bu ay sorgulandı) bu turda kaydı çıkmayan eski karolar silinir.
// Overpass kullanım kuralları: kendini tanıtan UA, sorgular arası bekleme, hata alınca katlanarak bekleme.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = path.join(ROOT, 'petiverse-places');
const OUT = path.join(BASE, 'v1');
const STATE = path.join(BASE, 'state.json');
const TILE = 5; // uygulamadaki TILE_DEG ile aynı olmalı
const UA = 'Petiverse-places-sync/1.1 (support@moonarcworks.com)';
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const DEADLINE = Date.now() + Number(process.env.DEADLINE_MIN ?? 300) * 60_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Önce bu şehirlerin çevresi (mağaza dilleri + büyük nüfus merkezleri), sonra dünyanın geri kalanı.
const FIRST = [
  [40.73, -73.98], [52.53, 13.41], [48.86, 2.36], [40.43, -3.7], [45.47, 9.21], [-23.56, -46.66], [52.36, 4.88],
  [52.22, 21.0], [50.08, 14.44], [48.15, 17.11], [47.5, 19.06], [44.44, 26.1], [45.81, 15.97], [44.81, 20.47],
  [42.69, 23.33], [37.98, 23.73], [55.76, 37.62], [50.45, 30.52], [59.33, 18.06], [59.92, 10.75], [55.68, 12.57],
  [60.17, 24.95], [24.71, 46.68], [32.08, 34.78], [28.57, 77.24], [13.74, 100.56], [10.78, 106.7], [-6.23, 106.81],
  [3.15, 101.71], [35.66, 139.7], [37.52, 127.05], [31.22, 121.46], [25.04, 121.56], [51.51, -0.13], [34.05, -118.24],
  [41.88, -87.63], [43.65, -79.38], [-33.87, 151.21], [-37.81, 144.96], [19.43, -99.13], [-34.6, -58.38], [30.04, 31.24],
  [19.08, 72.88], [1.35, 103.82], [25.2, 55.27], [53.35, -6.26], [38.72, -9.14], [47.37, 8.54], [48.21, 16.37],
  [50.85, 4.35], [41.9, 12.5], [41.39, 2.17], [45.76, 4.84], [53.55, 9.99], [48.14, 11.58], [-22.91, -43.17],
];

const key = (la, lo) => `${Math.floor(la / TILE) * TILE}_${Math.floor(lo / TILE) * TILE}`;
function order() {
  const keys = [];
  const add = (k) => keys.includes(k) || keys.push(k);
  for (const [la, lo] of FIRST) {
    for (const d of [[0, 0], [-1, 0], [1, 0], [0, -1.3], [0, 1.3]]) add(key(la + d[0], lo + d[1]));
  }
  for (let s = -60; s < 80; s += TILE) for (let w = -180; w < 180; w += TILE) add(`${s}_${w}`);
  return keys;
}

function query([s, w, n, e]) {
  return `[out:json][timeout:180][bbox:${s},${w},${n},${e}];
(
  nwr["amenity"="veterinary"];
  nwr["shop"="pet"];
  nwr["amenity"="animal_boarding"];
  nwr["shop"="pet_grooming"];
  nwr["amenity"="animal_shelter"];
  nwr["leisure"="dog_park"];
);
out tags center;`;
}

// Bir kutuyu ister; sunucu zaman aşımı/bellek hatası verirse (Overpass bunu 200 + "remark" ile de bildirir)
// kutuyu dörde bölüp parçaları ayrı ister. Süre dolarsa null döner (karo bir sonraki çalışmaya kalır).
async function overpass(bbox, depth = 0) {
  let wait = 15_000;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (Date.now() > DEADLINE) return null;
    const endpoint = ENDPOINTS[attempt % ENDPOINTS.length];
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
        body: new URLSearchParams({ data: query(bbox) }),
        signal: AbortSignal.timeout(240_000),
      });
      if (res.ok) {
        const json = await res.json();
        if (!/runtime error/i.test(json.remark ?? '')) return json.elements;
        console.error(`  ${bbox.join(',')}: ${json.remark.slice(0, 80)}`);
        break;
      }
      console.error(`  ${endpoint} ${res.status}, ${wait / 1000} sn sonra tekrar`);
    } catch (e) {
      console.error(`  ${endpoint} ${e.message}, ${wait / 1000} sn sonra tekrar`);
    }
    await sleep(wait);
    wait = Math.min(wait * 2, 300_000);
  }
  if (depth >= 2) return null;
  const [s, w, n, e] = bbox;
  const mLat = (s + n) / 2;
  const mLon = (w + e) / 2;
  const parts = [];
  for (const b of [[s, w, mLat, mLon], [s, mLon, mLat, e], [mLat, w, n, mLon], [mLat, mLon, n, e]]) {
    const got = await overpass(b, depth + 1);
    if (got === null) return null;
    parts.push(...got);
    await sleep(3000);
  }
  return parts;
}

function categoryOf(t) {
  if (t.amenity === 'veterinary') return 'vet';
  if (t.shop === 'pet') return 'shop';
  if (t.amenity === 'animal_boarding') return 'boarding';
  if (t.shop === 'pet_grooming') return 'grooming';
  if (t.amenity === 'animal_shelter') return 'shelter';
  if (t.leisure === 'dog_park') return 'park';
  return null;
}

function places(elements, [s, w]) {
  const seen = new Set();
  const out = [];
  for (const el of elements) {
    const t = el.tags ?? {};
    const c = categoryOf(t);
    const la = el.lat ?? el.center?.lat;
    const lo = el.lon ?? el.center?.lon;
    // Merkezi karonun dışına düşen (sınırı kesen) kayıt komşu karoya aittir.
    if (!c || la == null || lo == null || key(la, lo) !== `${s}_${w}`) continue;
    const id = `${c}:${la.toFixed(5)}:${lo.toFixed(5)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      c,
      la: Number(la.toFixed(5)),
      lo: Number(lo.toFixed(5)),
      n: t.name ?? null,
      p: t.phone ?? t['contact:phone'] ?? null,
      h: t.opening_hours ?? null,
      w: t.website ?? t['contact:website'] ?? null,
      e: t.emergency === 'yes' || /24\s*\/?\s*7/.test(t.opening_hours ?? '') || null,
    });
  }
  return out.sort((a, b) => a.la - b.la || a.lo - b.lo);
}

const cycle = new Date().toISOString().slice(0, 7);
let state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : null;
if (!state || (state.complete && state.cycle !== cycle)) state = { cycle, complete: false, done: {} };
fs.mkdirSync(OUT, { recursive: true });
const updated = new Date().toISOString().slice(0, 10);

const all = order();
const before = Object.keys(state.done).length;
for (const k of all) {
  if (k in state.done) continue;
  if (Date.now() > DEADLINE) break;
  const [s, w] = k.split('_').map(Number);
  const elements = await overpass([s, w, s + TILE, w + TILE]);
  if (elements === null) break;
  const list = places(elements, [s, w]);
  if (list.length) fs.writeFileSync(path.join(OUT, `${k}.json`), JSON.stringify({ updated, places: list }));
  state.done[k] = list.length;
  fs.writeFileSync(STATE, JSON.stringify(state));
  if (list.length) console.log(`${k}: ${list.length}`);
  await sleep(list.length ? 4000 : 1000);
}

const doneKeys = Object.keys(state.done);
state.complete = all.every((k) => k in state.done);
if (state.complete) {
  // Bu turda boş çıkan karonun eski dosyası silinir (uygulama 404'ü "boş" sayar).
  for (const f of fs.readdirSync(OUT)) {
    const k = f.replace(/\.json$/, '');
    if (k !== 'index' && !state.done[k]) fs.rmSync(path.join(OUT, f));
  }
}
fs.writeFileSync(STATE, JSON.stringify(state));
const tiles = fs.readdirSync(OUT).filter((f) => f !== 'index.json').map((f) => f.replace(/\.json$/, '')).sort();
const count = doneKeys.reduce((n, k) => n + state.done[k], 0);
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ updated, tile: TILE, tiles, count }));
console.log(`${doneKeys.length}/${all.length} karo bu tur sorgulandı, ${tiles.length} dolu karo${state.complete ? ' (tur tamam)' : ''}`);
// Action'a: tur bitmediyse kendini yeniden başlatsın.
// İlerleme yoksa (Overpass çöktü) yeniden başlatma: aylık zamanlayıcı ya da elle tetikleme devam ettirir.
const progress = doneKeys.length > before;
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `complete=${state.complete}\nprogress=${progress}\n`);
