// Petiverse "Yakındakiler" için dünya geneli hayvan mekânları (OpenStreetMap, ODbL), 5°×5° karolar halinde:
//   node tools/petiverse-places.mjs            → petiverse-places/v1/<lat>_<lon>.json + index.json
// Aylık GitHub Action çalıştırır (.github/workflows/petiverse-places.yml). Uygulama yalnızca kullanıcının
// çevresindeki karoları indirir (src/lib/placesRemote.ts); konum hiçbir yere gönderilmez.
// Overpass kullanım kuralları: kendini tanıtan UA, sorgular arası bekleme, hata alınca katlanarak bekleme.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'petiverse-places', 'v1');
const TILE = 5; // uygulamadaki TILE_DEG ile aynı olmalı
const BOX = 20; // sorgu kutusu (derece); karodan büyük, sorgu sayısını düşük tutar
const UA = 'Petiverse-places-sync/1.0 (support@moonarcworks.com)';
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function query([s, w, n, e]) {
  return `[out:json][timeout:240][bbox:${s},${w},${n},${e}];
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
// kutuyu dörde bölüp parçaları ayrı ister. Yoğun bölgeler (Avrupa, ABD) böylece tek sorguda boğulmaz.
async function overpass(bbox, depth = 0) {
  let wait = 20_000;
  const tries = depth < 3 ? 3 : 8;
  for (let attempt = 0; attempt < tries; attempt++) {
    const endpoint = ENDPOINTS[attempt % ENDPOINTS.length];
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
        body: new URLSearchParams({ data: query(bbox) }),
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
    wait = Math.min(wait * 2, 600_000);
  }
  if (depth >= 3) throw new Error(`Kutu alınamadı: ${bbox}`);
  const [s, w, n, e] = bbox;
  const mLat = (s + n) / 2;
  const mLon = (w + e) / 2;
  const parts = [];
  for (const b of [[s, w, mLat, mLon], [s, mLon, mLat, e], [mLat, w, n, mLon], [mLat, mLon, n, e]]) {
    parts.push(...(await overpass(b, depth + 1)));
    await sleep(5000);
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

const tiles = new Map();
const seen = new Set();
let total = 0;
for (let s = -60; s < 80; s += BOX) {
  for (let w = -180; w < 180; w += BOX) {
    const bbox = [s, w, Math.min(s + BOX, 85), w + BOX];
    const elements = await overpass(bbox);
    for (const el of elements) {
      const t = el.tags ?? {};
      const c = categoryOf(t);
      const la = el.lat ?? el.center?.lat;
      const lo = el.lon ?? el.center?.lon;
      if (!c || la == null || lo == null) continue;
      const id = `${c}:${la.toFixed(5)}:${lo.toFixed(5)}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const key = `${Math.floor(la / TILE) * TILE}_${Math.floor(lo / TILE) * TILE}`;
      if (!tiles.has(key)) tiles.set(key, []);
      tiles.get(key).push({
        c,
        la: Number(la.toFixed(5)),
        lo: Number(lo.toFixed(5)),
        n: t.name ?? null,
        p: t.phone ?? t['contact:phone'] ?? null,
        h: t.opening_hours ?? null,
        w: t.website ?? t['contact:website'] ?? null,
        e: t.emergency === 'yes' || /24\s*\/?\s*7/.test(t.opening_hours ?? '') || null,
      });
      total++;
    }
    if (elements.length) console.log(`${bbox.join(',')}: ${elements.length}`);
    await sleep(elements.length ? 8000 : 2000);
  }
}

// Eski karolar silinir (artık kaydı olmayan bölge 404 döner; uygulama bunu "boş" sayar).
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const updated = new Date().toISOString().slice(0, 10);
for (const [key, places] of tiles) {
  places.sort((a, b) => a.la - b.la || a.lo - b.lo);
  fs.writeFileSync(path.join(OUT, `${key}.json`), JSON.stringify({ updated, places }));
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ updated, tile: TILE, tiles: [...tiles.keys()].sort(), count: total }));
console.log(`${total} mekân, ${tiles.size} karo → petiverse-places/v1/`);
