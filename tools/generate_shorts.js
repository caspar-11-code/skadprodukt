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
// usuwa formy prawne z nazwy (S.A., sp. z o.o., GmbH, AG...) — czytelniejsze napisy i lektor bez „kropka"
function cleanLegal(s) {
  return String(s == null ? '' : s)
    .replace(/\s*\bS\.\s*A\.\.?/g, '')
    .replace(/\s*\bsp\.\s*z\s*o\.?\s*o\.?/gi, '')
    .replace(/\s*\bsp\.\s*j\./gi, '')
    .replace(/\s*(?:\bB\.V\.|\bN\.V\.|\bS\.E\.|\bInc\.|\bLtd\.|\bA\/S)/g, '')
    .replace(/\s*\b(?:GmbH|AG|LLC|plc)\b/g, '')
    .replace(/\s*\/\s*/g, ', ')
    .replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\(\)/g, '')
    .replace(/\s{2,}/g, ' ').replace(/\s+([.,)])/g, '$1').trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEAK: osobny tekst DLA LEKTORA (nazwy własne fonetycznie + liczby SŁOWAMI w poprawnej
// formie, np. lata w dopełniaczu „dwa tysiące dziewiętnastego"). Silnik, gdy short ma pole
// `speak`, czyta je DOSŁOWNIE (bez auto-przetwarzania) — więc musi tu być pełna fonetyka.
// Liczba zdań `speak` MUSI się zgadzać z napisami (split po .!?:); pilnujemy tego niżej.
// UWAGA: mapę nazw trzymać w zgodzie z engine/custom/pronunciations.json.
const SPEAK_NAMES = {
  'Jerónimo Martins': 'Jeronimo Martins', 'Xaviera Niela': 'Ksawjera Niela', 'Xavier Niel': 'Ksawje Niel',
  'MediaMarktSaturn': 'Media Markt Saturn', 'JD.com': 'Dżej Di kom', 'Coca-Cola': 'Koka Kola',
  'Mercedes-Benz': 'Mercedes Benc', 'Pernod Ricard': 'Perno Rikar', 'Danish Crown': 'Deniś Kraun',
  'Heineken': 'Hajneken', 'Goodyear': 'Gud Jer', 'Nestlé': 'Nesle', 'Nestle': 'Nesle',
  'Mondelēz': 'Mondeliz', 'Mondelez': 'Mondeliz', 'Schwarz': 'Szwarc', 'Volkswagen': 'Folksfagen',
  'McCormick': 'Makkormik', 'Michelin': 'Miszlę', 'Carlsberg': 'Karlsberg', 'Müller': 'Miler',
  'Rossmann': 'Rosman', 'Danone': 'Danon', 'Jerónimo': 'Jeronimo', 'Vičiūnai': 'Wiczunaj',
  'iliad': 'Iljad', 'Iliad': 'Iljad', 'Adeo': 'Adeo', 'Mulliez': 'Mulje', 'Decathlon': 'Dekatlon',
  'Ceconomy': 'Sekonomi', 'Convergenta': 'Konwergenta', 'Reddev': 'Reddew', 'Bunge': 'Bandżi',
  'Asahi': 'Asahi', 'Orange': 'Orendż', 'International': 'Internaszynal', 'Renault': 'Reno', 'Geely': 'Dżili', 'BYD': 'Bi Waj Di',
  'SAIC': 'Es A I Si', 'BMW': 'Be Em Wu', 'CVC': 'Ce Wu Ce', 'KKR': 'Ka Ka Er', 'Roshen': 'Roszen',
  'Leapmotor': 'Lipmotor', 'Polestar': 'Polstar', 'Unilever': 'Unilewer', 'Foodwell': 'Fudwel',
  'Smithfield': 'Smitfild', 'Salling': 'Saling', 'Lidl': 'Lidl',
};
const _ONES = ['', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć'];
const _TEENS = ['dziesięć', 'jedenaście', 'dwanaście', 'trzynaście', 'czternaście', 'piętnaście', 'szesnaście', 'siedemnaście', 'osiemnaście', 'dziewiętnaście'];
const _TENS = ['', '', 'dwadzieścia', 'trzydzieści', 'czterdzieści', 'pięćdziesiąt', 'sześćdziesiąt', 'siedemdziesiąt', 'osiemdziesiąt', 'dziewięćdziesiąt'];
const _HUNDREDS = ['', 'sto', 'dwieście', 'trzysta', 'czterysta', 'pięćset', 'sześćset', 'siedemset', 'osiemset', 'dziewięćset'];
function belowThousand(n) { const o = []; if (n >= 100) { o.push(_HUNDREDS[Math.floor(n / 100)]); n %= 100; } if (n >= 10 && n <= 19) { o.push(_TEENS[n - 10]); n = 0; } if (n >= 20) { o.push(_TENS[Math.floor(n / 10)]); n %= 10; } if (n >= 1) o.push(_ONES[n]); return o.filter(Boolean); }
function numWords(n) { if (n === 0) return 'zero'; if (n < 1000) return belowThousand(n).join(' '); const th = Math.floor(n / 1000), rem = n % 1000; let tw; if (th === 1) tw = 'tysiąc'; else { const last = th % 10, lt = th % 100; tw = belowThousand(th).join(' ') + ((last >= 2 && last <= 4 && !(lt >= 12 && lt <= 14)) ? ' tysiące' : ' tysięcy'); } const parts = [tw]; if (rem) parts.push(belowThousand(rem).join(' ')); return parts.join(' '); }
// dopełniacz porządkowy 1-99 (do lat: „dziewiętnastego", „dwudziestego drugiego")
const _OG_UNITS = ['', 'pierwszego', 'drugiego', 'trzeciego', 'czwartego', 'piątego', 'szóstego', 'siódmego', 'ósmego', 'dziewiątego'];
const _OG_TEENS = ['dziesiątego', 'jedenastego', 'dwunastego', 'trzynastego', 'czternastego', 'piętnastego', 'szesnastego', 'siedemnastego', 'osiemnastego', 'dziewiętnastego'];
const _OG_TENS = ['', '', 'dwudziestego', 'trzydziestego', 'czterdziestego', 'pięćdziesiątego', 'sześćdziesiątego', 'siedemdziesiątego', 'osiemdziesiątego', 'dziewięćdziesiątego'];
function ordGen(n) { if (n === 0) return ''; if (n >= 10 && n <= 19) return _OG_TEENS[n - 10]; const t = Math.floor(n / 10), u = n % 10, o = []; if (t >= 2) o.push(_OG_TENS[t]); if (u >= 1) o.push(_OG_UNITS[u]); return o.join(' '); }
// miejscownik/narzędnik porządkowy („w 2026 r." -> „w dwa tysiące dwudziestym szóstym roku")
const _OL_UNITS = ['', 'pierwszym', 'drugim', 'trzecim', 'czwartym', 'piątym', 'szóstym', 'siódmym', 'ósmym', 'dziewiątym'];
const _OL_TEENS = ['dziesiątym', 'jedenastym', 'dwunastym', 'trzynastym', 'czternastym', 'piętnastym', 'szesnastym', 'siedemnastym', 'osiemnastym', 'dziewiętnastym'];
const _OL_TENS = ['', '', 'dwudziestym', 'trzydziestym', 'czterdziestym', 'pięćdziesiątym', 'sześćdziesiątym', 'siedemdziesiątym', 'osiemdziesiątym', 'dziewięćdziesiątym'];
function ordLoc(n) { if (n === 0) return ''; if (n >= 10 && n <= 19) return _OL_TEENS[n - 10]; const t = Math.floor(n / 10), u = n % 10, o = []; if (t >= 2) o.push(_OL_TENS[t]); if (u >= 1) o.push(_OL_UNITS[u]); return o.join(' '); }
function yearWords(y, loc) {
  const ord = loc ? ordLoc : ordGen;
  if (y >= 2000 && y <= 2099) { const r = y - 2000; return r === 0 ? (loc ? 'dwutysięcznym' : 'dwutysięcznego') : 'dwa tysiące ' + ord(r); }
  if (y >= 1900 && y <= 1999) return 'tysiąc dziewięćset ' + ord(y - 1900);
  return numWords(y);
}

function sentenceToSpeak(sent) {
  let s = ' ' + sent + ' ';
  for (const k of Object.keys(SPEAK_NAMES).sort((a, b) => b.length - a.length)) {
    s = s.replace(new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi'), SPEAK_NAMES[k]);
  }
  s = s.replace(/\bS\.\s*A\.\.?/g, '').replace(/\bsp\.\s*z\s*o\.?\s*o\.?/gi, '').replace(/\bsp\.\s*j\./gi, '')
    .replace(/\bB\.V\.|\bN\.V\.|\bS\.E\.|\bInc\.|\bLtd\.|\bA\/S/g, '').replace(/\b(?:GmbH|AG|LLC|plc)\b/g, '')
    .replace(/\s*\/\s*/g, ', ');
  // rok z przyimkiem: „w/we/po/przed/przy" -> miejscownik; „od/do/z/ze" -> dopełniacz
  s = s.replace(/\b(w|we|po|przed|przy|od|do|z|ze)\s+((?:19|20)\d{2})\b(\s*(?:r\.|roku))?/gi,
    (m, prep, yr, rr) => prep + ' ' + yearWords(+yr, /^(w|we|po|przed|przy)$/i.test(prep)) + (rr ? ' roku' : ''));
  // pozostałe lata (bez przyimka) -> dopełniacz
  s = s.replace(/\b((?:19|20)\d{2})\b(\s*(?:r\.|roku))?/g, (m, yr, rr) => yearWords(+yr, false) + (rr ? ' roku' : ''));
  s = s.replace(/(\d+),(\d+)\s*%/g, (m, a, b) => numWords(+a) + ' przecinek ' + numWords(+b) + ' procent');
  s = s.replace(/(\d+)\s*%/g, (m, a) => numWords(+a) + ' procent');
  s = s.replace(/(\d+),(\d+)/g, (m, a, b) => numWords(+a) + ' przecinek ' + numWords(+b));
  s = s.replace(/\bmln\b/g, 'milionów').replace(/\bmld\b/g, 'miliardów').replace(/\bzł\b/g, 'złotych')
    .replace(/\bUSD\b/g, 'dolarów').replace(/\bEUR\b/g, 'euro');
  s = s.replace(/\br\./g, 'roku').replace(/\bnp\./g, 'na przykład').replace(/\bm\.in\./g, 'między innymi')
    .replace(/\bok\./g, 'około').replace(/\btzw\./g, 'tak zwany').replace(/\bitd\./g, 'i tak dalej')
    .replace(/\bGPW\b/g, 'gie pe wu').replace(/\bUE\b/g, 'Unii Europejskiej');
  s = s.replace(/\bskadprodukt\.org\b/gi, 'skadprodukt kropka org');
  s = s.replace(/\d+/g, (m) => { const n = +m; return n <= 999999 ? numWords(n) : m; });
  s = s.replace(/\(\s*\)/g, '').replace(/\s{2,}/g, ' ').replace(/\s+([.,!?:)])/g, '$1');
  return s.trim();
}

// podział na zdania — ZGODNY z silnikiem (make_short.split_sentences): dziel po .!?:+spacja,
// ale sklej fragment z poprzednim, gdy poprzedni kończy się skrótem, a fragment zaczyna od małej
// litery/cyfry (np. „od 2019 r. marka" = środek; „w 2026 r. Browar" = koniec zdania).
const _ABBR_END = /(?:\b(?:r|ok|np|tzw|itd|tj|nr|ul|al|sp)\.|o\.o\.|m\.in\.|[A-Za-z]\.[A-Za-z]\.)$/;
function _splitSents(t) {
  const parts = t.trim().split(/(?<=[.!?:])\s+/).map(x => x.trim()).filter(Boolean);
  const out = [];
  for (const p of parts) {
    if (out.length && _ABBR_END.test(out[out.length - 1]) && /^[a-ząćęłńóśźż0-9]/.test(p)) out[out.length - 1] += ' ' + p;
    else out.push(p);
  }
  return out;
}
// buduje `speak`; zachowuje terminatory zdań, by podział .!?: dał tę samą liczbę zdań co napisy
function buildSpeak(narration) {
  const speak = _splitSents(narration).map(sent => {
    const term = /[.!?:]$/.test(sent) ? sent.slice(-1) : '';
    return sentenceToSpeak(sent).replace(/[.!?:]+$/, '').trim() + term;
  }).join(' ');
  return (_splitSents(speak).length === _splitSents(narration).length) ? speak : null;
}

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
// CTA: adres serwisu ZAWSZE na końcu i BEZ kropki po nim (lepiej się „reklamuje", ładna ramka końcowa)
const CTAS = [
  `Obserwuj po więcej — pełną bazę marek masz na ${SITE}`,
  `Zostań na kanale, a bazę i źródła sprawdzisz na ${SITE}`,
  `Sprawdź swoją ulubioną markę na ${SITE}`,
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
// zdania z capitalNote — podział ODPORNY na skróty (jak w silniku), bez śmieciowych fragmentów
const sentencesOf = s => _splitSents(clean(s)).filter(x => x.length >= 28 && /^[A-ZĄĆĘŁŃÓŚŹŻ„"]/.test(x));

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
  // „Konkretnie: <miasto>" tylko dla realnego zakładu produkcji — nie dla siedziby/centrali/sieci sklepów
  const pl0 = p.plants[0] || '';
  const city = (pl0 && pl0.length < 60 && /[a-ząćęłńóśźż0-9]/i.test(pl0)
    && !/^(Siedziba|Centrala|Ogólnopolska|Sieć|Ponad|Ok\.|ok\.|\d)/i.test(pl0))
    ? 'Konkretnie: ' + pl0 + '.' : '';
  const lines = [
    `Produkcja? ${cname(p.productionCountry)}. ${city}`.trim(),
    `Ale właściciel marki to ${cleanLegal(p.brandOwner)}.`,
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
  // osobny tekst dla lektora (nazwy fonetycznie + liczby słowami); null gdy nie zgadza się podział zdań
  const speak = buildSpeak(lines.join(' ') + ' ' + cta);
  return {
    slug: p.slug,
    speak: speak || undefined,
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
