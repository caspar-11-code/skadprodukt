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

const COUNTRY_PL = { PL: 'Polska', DE: 'Niemcy', CH: 'Szwajcaria', US: 'USA', NL: 'Holandia', JP: 'Japonia', KR: 'Korea Południowa', PT: 'Portugalia', LU: 'Luksemburg', UA: 'Ukraina', LT: 'Litwa', HU: 'Węgry', CN: 'Chiny', DK: 'Dania', IT: 'Włochy', IN: 'Indie', SE: 'Szwecja', CZ: 'Czechy', GB: 'Wielka Brytania', FR: 'Francja', ES: 'Hiszpania', HK: 'Hongkong', HR: 'Chorwacja', RU: 'Rosja', CY: 'Cypr', CA: 'Kanada', ZA: 'RPA', DK: 'Dania', BY: 'Białoruś', RO: 'Rumunia', IL: 'Izrael', XX: 'różne kraje', EU: 'Unia Europejska' };
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

// --- dedup + wydłużanie narracji do sweet-spotu retencji (30–45 s, research 2026) ---
// Zasada redakcyjna: NIE dopisujemy treści dla długości — dokładamy WYŁĄCZNIE zweryfikowane
// fakty z rekordu (funFact, podział udziałów `stakes`, zdania `capitalNote`), z deduplikacją
// względem story. Marki o ubogich danych zostają krótsze — świadomie, bez waty.
const norm = s => clean(s).toLowerCase().replace(/[^a-ząćęłńóśźż0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const stems = s => norm(s).split(' ').filter(w => w.length >= 5).map(w => w.slice(0, 6));
function similar(a, b) { // podobieństwo po rdzeniach (odporne na polską fleksję)
  const A = new Set(stems(a)), B = stems(b);
  if (!A.size || !B.length) return false;
  let common = 0; for (const w of B) if (A.has(w)) common++;
  return common / Math.min(A.size, B.length) >= 0.42;
}
const dupAny = (s, pool) => pool.some(x => similar(s, x));
const sentencesOf = s => clean(s).split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(x => x.length >= 28);

function stakesLine(p) { // konkretny podział % — dotąd nieużywany w narracji
  if (!Array.isArray(p.stakes) || !p.stakes.length) return null;
  const skip = /free[\s-]?float|pozosta|inni akcjonar/i;
  const parts = p.stakes
    .filter(s => s && s.holder && s.pct && !skip.test(s.holder))
    .slice(0, 3)
    .map(s => `${String(s.holder).replace(/\s*\([^)]*\)/g, '').replace(/\//g, ' ').replace(/\s+/g, ' ').trim()} ${String(s.pct).trim()}`);
  return parts.length ? `Udziały: ${parts.join(', ')}.` : null;
}

function bodyFacts(p) {
  const said = [clean(p.story)];
  const body = [clean(p.story)];
  const fun = clean(p.funFact);
  if (fun && !dupAny(fun, said)) { body.push(fun); said.push(fun); }
  const sl = stakesLine(p);
  if (sl) body.push(sl);
  const words = () => body.join(' ').split(/\s+/).filter(Boolean).length;
  for (const s of sentencesOf(p.capitalNote)) {
    if (words() >= 52) break; // miękki limit — sweet-spot ~30–40 s, bez przekraczania ~45 s
    if (!dupAny(s, said) && !dupAny(s, body)) { body.push(s); said.push(s); }
  }
  return body;
}

function shortScript(p, i) {
  const hook = HOOKS[i % HOOKS.length](p.brand, p.capitalCountry);
  const foreign = p.capitalCountry !== 'PL';
  const city = (p.plants[0] && p.plants[0].length < 60 && /[a-ząćęłńóśźż0-9]/i.test(p.plants[0]))
    ? 'Konkretnie: ' + p.plants[0] + '.' : '';
  const lines = [
    `Produkcja? ${cname(p.productionCountry)}. ${city}`.trim(),
    `Ale właściciel marki to ${p.brandOwner}.`,
    foreign
      ? `Kapitał? ${cname(p.capitalCountry).toUpperCase()}. Tam trafiają zyski.`
      : `A kapitał? Tu niespodzianka: ${cname(p.capitalCountry).toUpperCase()}.`,
    ...bodyFacts(p),
    CLOSERS[i % CLOSERS.length],
  ].filter(Boolean);
  const cta = CTAS[i % CTAS.length];
  // Twardy limit długości: realny render ≈ szac.(słów/2.9) + narzut zdań (do ~10 s).
  // Celujemy w ≤ ~44 s realnego renderu → CAP na słowa całej narracji. Przycinamy opcjonalne
  // fakty OD KOŃCA (capitalNote → stakes → funFact), NIGDY story ani rdzenia/closera.
  const CAP = 96;
  const wc = () => (hook + ' ' + lines.join(' ') + ' ' + cta).split(/\s+/).filter(Boolean).length;
  while (wc() > CAP && lines.length > 5) lines.splice(lines.length - 2, 1);
  return {
    slug: p.slug,
    title: `${p.brand} — skąd to pochodzi? ${flag(p.productionCountry)}→${flag(p.capitalCountry)}`,
    hook,
    lines,
    cta,
    hashtags: ['#shorts', '#skadprodukt', '#pochodzenieproduktow', '#' + p.slug.replace(/-/g, ''), '#zakupy', '#swiadomykonsument',
      p.capitalCountry === 'PL' ? '#polskamarka' : '#zagranicznykapital',
      '#' + String(p.category || '').toLowerCase().replace(/[^a-ząćęłńóśźż0-9]/g, ''),
      '#ciekawostki', '#polska', '#biznes', '#wiedza'].filter(h => h.length > 1),
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
