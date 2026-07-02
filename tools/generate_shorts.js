#!/usr/bin/env node
/*
 * Generator treści wideo/social z bazy produktów.
 * node tools/generate_shorts.js  →  output/shorts/*.json + *.txt  oraz  output/cards/*.svg
 *
 * Format JSON jest zgodny z silnikiem C:\Users\hkacp\auto-content-engine
 * (make_short.py: hook → lines[] → cta; lektor edge-tts pl-PL-MarekNeural).
 * Karty SVG (1080x1350) można wrzucać bezpośrednio jako grafiki na social
 * lub renderować do PNG (przeglądarka / ffmpeg).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = (process.env.SITE_URL || 'https://skadprodukt.org').replace('https://', '');
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'products.json'), 'utf8'));

const COUNTRY_PL = { PL: 'Polska', DE: 'Niemcy', CH: 'Szwajcaria', US: 'USA', NL: 'Holandia', JP: 'Japonia', KR: 'Korea Południowa', PT: 'Portugalia', LU: 'Luksemburg', UA: 'Ukraina', LT: 'Litwa', HU: 'Węgry', CN: 'Chiny', DK: 'Dania', IT: 'Włochy', IN: 'Indie', SE: 'Szwecja', CZ: 'Czechy', GB: 'Wielka Brytania', FR: 'Francja', ES: 'Hiszpania', HK: 'Hongkong', XX: 'różne kraje', EU: 'Unia Europejska' };
const cname = cc => COUNTRY_PL[cc] || cc;
const flag = cc => cc === 'EU' ? '🇪🇺' : cc === 'XX' ? '🌐' : String.fromCodePoint(...[...cc].map(c => 0x1f1a5 + c.charCodeAt(0)));
const clean = s => String(s == null ? '' : s).replace(/==/g, ''); // ==wyróżnienia== są tylko dla www

const HOOKS = [
  b => `Czy wiesz, do kogo naprawdę należy ${b}?`,
  b => `${b} — polska marka? Sprawdźmy, dokąd płyną pieniądze.`,
  b => `Kupujesz ${b}? Zobacz, kto na tym zarabia.`,
  b => `Skąd tak naprawdę pochodzi ${b}? Odpowiedź może zaskoczyć.`,
];

function shortScript(p, i) {
  const hook = HOOKS[i % HOOKS.length](p.brand);
  const lines = [
    `Produkcja: ${cname(p.productionCountry)}. ${p.plants[0] && p.plants[0].length < 80 ? 'Konkretnie: ' + p.plants[0] + '.' : ''}`,
    `Właściciel marki: ${p.brandOwner}.`,
    `A kapitał? ${cname(p.capitalCountry)}.`,
    clean(p.story),
  ].filter(Boolean);
  return {
    slug: p.slug,
    title: `${p.brand} — skąd to pochodzi? ${flag(p.productionCountry)}→${flag(p.capitalCountry)}`,
    hook,
    lines,
    cta: `Więcej marek sprawdzisz na ${SITE}. Obserwuj po kolejne!`,
    hashtags: ['#skadprodukt', '#pochodzenieproduktow', '#' + p.slug.replace(/-/g, ''), '#zakupy', '#swiadomykonsument',
      p.capitalCountry === 'PL' ? '#polskamarka' : '#zagranicznykapital'],
    voice: 'pl-PL-MarekNeural',
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
