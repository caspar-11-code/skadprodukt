#!/usr/bin/env node
/*
 * Generator treści wideo/social z bazy produktów.
 * node tools/generate_shorts.js  →  output/shorts/*.json + *.txt  oraz  output/cards/*.svg
 *
 * Format JSON jest zgodny z silnikiem C:\Users\hkacp\auto-content-engine
 * (make_short.py: hook → lines[] → cta; lektor edge-tts de-DE-FlorianMultilingualNeural).
 * Karty SVG (1080x1350) można wrzucać bezpośrednio jako grafiki na social
 * lub renderować do PNG (przeglądarka / ffmpeg).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = (process.env.SITE_URL || 'https://skadprodukt.org').replace('https://', '');
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'products.json'), 'utf8'));

const COUNTRY_PL = { PL: 'Polska', DE: 'Niemcy', CH: 'Szwajcaria', US: 'USA', NL: 'Holandia', JP: 'Japonia', KR: 'Korea Południowa', PT: 'Portugalia', LU: 'Luksemburg', UA: 'Ukraina', LT: 'Litwa', HU: 'Węgry', CN: 'Chiny', DK: 'Dania', IT: 'Włochy', IN: 'Indie', SE: 'Szwecja', CZ: 'Czechy', GB: 'Wielka Brytania', FR: 'Francja', ES: 'Hiszpania', HK: 'Hongkong', HR: 'Chorwacja', XX: 'różne kraje', EU: 'Unia Europejska' };
const cname = cc => COUNTRY_PL[cc] || cc;
const flag = cc => cc === 'EU' ? '🇪🇺' : cc === 'XX' ? '🌐' : String.fromCodePoint(...[...cc].map(c => 0x1f1a5 + c.charCodeAt(0)));
const clean = s => String(s == null ? '' : s).replace(/==/g, ''); // ==wyróżnienia== są tylko dla www

const HOOKS = [
  (b, c) => `Do kogo NAPRAWDĘ należy ${b}?`,
  (b, c) => `${b} — myślisz, że wiesz, czyje to? Błąd.`,
  (b, c) => `Kupujesz ${b}? Zgadnij, dokąd płyną pieniądze.`,
  (b, c) => `${b}: tego nie ma na etykiecie.`,
];
const CLOSERS = [
  `Wszystko legalne i jawne. Tylko nikt o tym nie mówi.`,
  `Na etykiecie tego nie znajdziesz.`,
  `W reklamie tego nie usłyszysz.`,
  `A na półce wygląda swojsko, prawda?`,
];
const CTAS = [
  `Więcej marek sprawdzisz na ${SITE}. Obserwuj po kolejne!`,
  `Pełna baza i źródła na ${SITE}. Zostań — będzie więcej.`,
  `Sprawdź swoją ulubioną markę na ${SITE} i obserwuj.`,
];

// dodatkowa ciekawostka: pole funFact z rekordu, a gdy go brak — pierwsze zdanie
// capitalNote, o ile nie dubluje story (urozmaica short ponad schemat nazwa→kraj)
function extraFact(p) {
  if (p.funFact) return clean(p.funFact);
  const s1 = (clean(p.capitalNote).split(/(?<=[.!?])\s+/)[0] || '').trim();
  const story = clean(p.story);
  if (s1 && s1.length >= 30 && s1.length <= 170 && !story.includes(s1.slice(0, 25)) && !s1.includes(story.slice(0, 25))) return s1;
  return null;
}

function shortScript(p, i) {
  const hook = HOOKS[i % HOOKS.length](p.brand, p.capitalCountry);
  const foreign = p.capitalCountry !== 'PL';
  const lines = [
    `Produkcja? ${cname(p.productionCountry)}. ${p.plants[0] && p.plants[0].length < 60 ? 'Konkretnie: ' + p.plants[0] + '.' : ''}`,
    `Ale właściciel marki to ${p.brandOwner}.`,
    foreign
      ? `Kapitał? ${cname(p.capitalCountry).toUpperCase()}. Tam trafiają zyski.`
      : `A kapitał? Tu niespodzianka: ${cname(p.capitalCountry).toUpperCase()}.`,
    clean(p.story),
    extraFact(p),
    CLOSERS[i % CLOSERS.length],
  ].filter(Boolean);
  return {
    slug: p.slug,
    title: `${p.brand} — skąd to pochodzi? ${flag(p.productionCountry)}→${flag(p.capitalCountry)}`,
    hook,
    lines,
    cta: CTAS[i % CTAS.length],
    hashtags: ['#skadprodukt', '#pochodzenieproduktow', '#' + p.slug.replace(/-/g, ''), '#zakupy', '#swiadomykonsument',
      p.capitalCountry === 'PL' ? '#polskamarka' : '#zagranicznykapital'],
    voice: 'piper:pl_PL-mc_speech-medium',
    card: `output/cards/${p.slug}.svg`,
    disclaimer: `Dane z publicznych źródeł, stan na ${p.updated}. Szczegóły i źródła: ${SITE}/p/${p.slug}/`,
    confidence: p.confidence,
  };
}

function cardSVG(p) {
  const polish = p.capitalCountry === 'PL';
  const accent = polish ? '#2e9e5b' : '#e05252';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" font-family="Segoe UI, Arial, sans-serif">
<rect width="1080" height="1350" fill="#101418"/>
<rect x="0" y="0" width="1080" height="14" fill="${accent}"/>
<text x="70" y="140" font-size="48" fill="#8a94a0">SkądProdukt.org</text>
<text x="70" y="300" font-size="96" font-weight="bold" fill="#ffffff">${esc(p.brand).slice(0, 40)}</text>
<text x="70" y="380" font-size="44" fill="#8a94a0">${esc(p.category)}</text>
<text x="70" y="540" font-size="46" fill="#8a94a0">PRODUKCJA</text>
<text x="70" y="630" font-size="72" fill="#ffffff">${flag(p.productionCountry)} ${esc(cname(p.productionCountry))}</text>
<text x="70" y="790" font-size="46" fill="#8a94a0">WŁAŚCICIEL MARKI</text>
<text x="70" y="880" font-size="56" fill="#ffffff">${esc(p.brandOwner).slice(0, 44)}</text>
<text x="70" y="1040" font-size="46" fill="#8a94a0">KAPITAŁ</text>
<text x="70" y="1130" font-size="72" font-weight="bold" fill="${accent}">${flag(p.capitalCountry)} ${esc(cname(p.capitalCountry))}</text>
<text x="70" y="1280" font-size="40" fill="#5a626b">${SITE} · stan: ${p.updated}</text>
</svg>`;
}

const shortsDir = path.join(ROOT, 'output', 'shorts');
const cardsDir = path.join(ROOT, 'output', 'cards');
fs.mkdirSync(shortsDir, { recursive: true });
fs.mkdirSync(cardsDir, { recursive: true });

let skipped = 0;
db.products.forEach((p, i) => {
  if (p.confidence !== 'publiczne') { skipped++; return; } // do publikacji tylko potwierdzone
  const s = shortScript(p, i);
  fs.writeFileSync(path.join(shortsDir, `${p.slug}.json`), JSON.stringify(s, null, 2));
  fs.writeFileSync(path.join(shortsDir, `${p.slug}.txt`),
    `${s.title}\n\n[HOOK]\n${s.hook}\n\n[TREŚĆ]\n${s.lines.join('\n')}\n\n[CTA]\n${s.cta}\n\n[HASHTAGI]\n${s.hashtags.join(' ')}\n\n[DISCLAIMER — w opisie filmu]\n${s.disclaimer}\n`);
  fs.writeFileSync(path.join(cardsDir, `${p.slug}.svg`), cardSVG(p));
});

const n = db.products.length - skipped;
console.log(`OK: ${n} skryptów Shorts (output/shorts/) + ${n} kart SVG (output/cards/).`);
if (skipped) console.log(`Pominięto ${skipped} rekordów "do-weryfikacji" — publikujemy tylko potwierdzone.`);
