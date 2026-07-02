#!/usr/bin/env node
/*
 * SkądTo? — generator statycznego serwisu o pochodzeniu produktów.
 * Zero zależności: node build.js  →  public/
 * Licencja: PolyForm Noncommercial 1.0.0, Copyright Kacper (2026)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'public');
const SITE_URL = process.env.SITE_URL || 'https://skadto.pages.dev';
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const COUNTRIES = {
  PL: { pl: 'Polska', en: 'Poland' },
  DE: { pl: 'Niemcy', en: 'Germany' },
  CH: { pl: 'Szwajcaria', en: 'Switzerland' },
  US: { pl: 'USA', en: 'USA' },
  NL: { pl: 'Holandia', en: 'Netherlands' },
  JP: { pl: 'Japonia', en: 'Japan' },
  KR: { pl: 'Korea Płd.', en: 'South Korea' },
  PT: { pl: 'Portugalia', en: 'Portugal' },
  LU: { pl: 'Luksemburg', en: 'Luxembourg' },
  UA: { pl: 'Ukraina', en: 'Ukraine' },
  FR: { pl: 'Francja', en: 'France' },
  GB: { pl: 'Wielka Brytania', en: 'United Kingdom' },
  LT: { pl: 'Litwa', en: 'Lithuania' },
  HU: { pl: 'Węgry', en: 'Hungary' },
  EU: { pl: 'Unia Europejska (różne)', en: 'European Union (various)' },
};

function flag(cc) {
  if (!cc || cc === 'EU') return '🇪🇺';
  return String.fromCodePoint(...[...cc.toUpperCase()].map(c => 0x1f1a5 + c.charCodeAt(0)));
}
function countryName(cc, lang = 'pl') {
  return (COUNTRIES[cc] && COUNTRIES[cc][lang]) || cc;
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------- dane ----------
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'products.json'), 'utf8'));
const products = db.products.slice().sort((a, b) => a.brand.localeCompare(b.brand, 'pl'));

// statystyki kapitału
const capitalStats = {};
for (const p of products) capitalStats[p.capitalCountry] = (capitalStats[p.capitalCountry] || 0) + 1;
const statsSorted = Object.entries(capitalStats).sort((a, b) => b[1] - a[1]);

// ---------- szablon strony ----------
function page({ title, desc, urlPath, body, extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE_URL}${urlPath}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE_URL}${urlPath}">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🧭</text></svg>')}">
<link rel="stylesheet" href="/assets/style.css">
${extraHead}
</head>
<body>
<header class="site-header">
  <a class="logo" href="/"><span class="logo-icon">🧭</span> Skąd<span class="accent">To</span>?</a>
  <nav>
    <a href="/" data-i18n="nav.home">Baza</a>
    <a href="/statystyki/" data-i18n="nav.stats">Statystyki</a>
    <a href="/metodologia/" data-i18n="nav.method">Metodologia</a>
    <button id="lang-toggle" class="lang-btn" title="PL / EN">EN</button>
  </nav>
</header>
<main>
${body}
</main>
<footer class="site-footer">
  <p data-i18n="footer.disclaimer">Dane zebrane z publicznych źródeł (etykiety, KRS, rejestry, strony producentów, prasa). Mogą być nieaktualne — zawsze sprawdź źródła podane przy produkcie. To serwis informacyjno-edukacyjny, nie porada zakupowa.</p>
  <p>© Kacper 2026 · PolyForm Noncommercial 1.0.0 · <span data-i18n="footer.updated">aktualizacja:</span> ${BUILD_DATE} · <a href="/metodologia/#zglos" data-i18n="footer.report">zgłoś poprawkę</a></p>
</footer>
<script src="/assets/app.js"></script>
</body>
</html>`;
}

// ---------- karta produktu (lista) ----------
function productCard(p) {
  return `<a class="card" href="/p/${p.slug}/" data-search="${esc((p.brand + ' ' + p.producer + ' ' + p.brandOwner + ' ' + p.category).toLowerCase())}" data-capital="${p.capitalCountry}" data-category="${esc(p.category)}">
  <div class="card-head"><h3>${esc(p.brand)}</h3><span class="cat">${esc(p.category)}</span></div>
  <div class="card-flags">
    <span title="Kraj produkcji"><small data-i18n="card.made">produkcja</small> ${flag(p.productionCountry)} ${esc(countryName(p.productionCountry))}</span>
    <span class="arrow">→</span>
    <span title="Pochodzenie kapitału"><small data-i18n="card.capital">kapitał</small> ${flag(p.capitalCountry)} ${esc(countryName(p.capitalCountry))}</span>
  </div>
  <p class="card-owner">${esc(p.brandOwner)}</p>
  ${p.confidence === 'do-weryfikacji' ? '<span class="badge-verify" data-i18n="card.verify">⚠ do weryfikacji</span>' : ''}
</a>`;
}

// ---------- SVG karta social (1080x1350) ----------
function shareSVG(p) {
  const polish = p.capitalCountry === 'PL';
  const accent = polish ? '#2e9e5b' : '#e05252';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" font-family="Segoe UI, Arial, sans-serif">
<rect width="1080" height="1350" fill="#101418"/>
<rect x="0" y="0" width="1080" height="14" fill="${accent}"/>
<text x="70" y="140" font-size="52" fill="#8a94a0">🧭 SkądTo?</text>
<text x="70" y="300" font-size="96" font-weight="bold" fill="#ffffff">${esc(p.brand)}</text>
<text x="70" y="380" font-size="44" fill="#8a94a0">${esc(p.category)}</text>
<text x="70" y="540" font-size="46" fill="#8a94a0">PRODUKCJA</text>
<text x="70" y="630" font-size="72" fill="#ffffff">${flag(p.productionCountry)} ${esc(countryName(p.productionCountry))}</text>
<text x="70" y="790" font-size="46" fill="#8a94a0">WŁAŚCICIEL MARKI</text>
<text x="70" y="880" font-size="60" fill="#ffffff">${esc(p.brandOwner)}</text>
<text x="70" y="1040" font-size="46" fill="#8a94a0">KAPITAŁ</text>
<text x="70" y="1130" font-size="72" font-weight="bold" fill="${accent}">${flag(p.capitalCountry)} ${esc(countryName(p.capitalCountry))}</text>
<text x="70" y="1280" font-size="40" fill="#5a626b">${SITE_URL.replace('https://', '')} · stan: ${p.updated}</text>
</svg>`;
}

// ---------- strona produktu ----------
function productPage(p) {
  const rows = [
    ['Marka', 'field.brand', p.brand],
    ['Kategoria', 'field.category', p.category],
    ['Producent', 'field.producer', p.producer],
    ['Kraj produkcji', 'field.madeIn', `${flag(p.productionCountry)} ${countryName(p.productionCountry)}`],
    ['Zakłady / lokalizacje', 'field.plants', p.plants.join('; ')],
    ['Właściciel marki', 'field.owner', p.brandOwner],
    ['Kraj właściciela', 'field.ownerCountry', `${flag(p.ownerCountry)} ${countryName(p.ownerCountry)}`],
    ['Pochodzenie kapitału', 'field.capital', `${flag(p.capitalCountry)} ${countryName(p.capitalCountry)}`],
  ];
  const body = `
<article class="product">
  <p class="crumbs"><a href="/">← <span data-i18n="nav.back">wszystkie produkty</span></a></p>
  <h1>${esc(p.brand)} <span class="flags-inline">${flag(p.productionCountry)}→${flag(p.capitalCountry)}</span></h1>
  <p class="lead">${esc(p.capitalNote)}</p>
  ${p.confidence === 'do-weryfikacji' ? '<p class="verify-banner" data-i18n="product.verify">⚠ Rekord oznaczony jako „do weryfikacji" — potwierdź dane w źródłach przed cytowaniem.</p>' : ''}
  <div class="chain">
    <div class="chain-step"><small data-i18n="chain.brand">marka</small><strong>${esc(p.brand)}</strong></div>
    <div class="chain-arrow">→</div>
    <div class="chain-step"><small data-i18n="chain.producer">producent</small><strong>${esc(p.producer)}</strong></div>
    <div class="chain-arrow">→</div>
    <div class="chain-step"><small data-i18n="chain.owner">właściciel</small><strong>${esc(p.brandOwner)}</strong></div>
    <div class="chain-arrow">→</div>
    <div class="chain-step chain-final"><small data-i18n="chain.capital">kapitał</small><strong>${flag(p.capitalCountry)} ${esc(countryName(p.capitalCountry))}</strong></div>
  </div>
  <table class="facts">
    ${rows.map(([label, key, val]) => `<tr><th data-i18n="${key}">${esc(label)}</th><td>${esc(val)}</td></tr>`).join('\n    ')}
    <tr><th data-i18n="field.updated">Stan na</th><td>${esc(p.updated)}</td></tr>
  </table>
  <h2 data-i18n="product.sources">Źródła</h2>
  <ul class="sources">
    ${p.sources.map(s => `<li><a href="${esc(s.url)}" rel="nofollow noopener" target="_blank">${esc(s.label)}</a></li>`).join('\n    ')}
  </ul>
  <h2 data-i18n="product.share">Karta do udostępnienia</h2>
  <div class="share-card" id="share-card">${shareSVG(p)}</div>
  <button class="btn" id="dl-card" data-slug="${p.slug}" data-i18n="product.download">Pobierz PNG</button>
  <p class="disclaimer" data-i18n="product.disclaimer">Wszystkie informacje pochodzą z publicznych źródeł i mają charakter edukacyjny. Jeśli reprezentujesz markę i widzisz błąd — <a href="/metodologia/#zglos">zgłoś poprawkę</a>.</p>
</article>`;
  return page({
    title: `${p.brand} — skąd pochodzi, kto jest właścicielem? | SkądTo?`,
    desc: `${p.brand}: produkcja ${countryName(p.productionCountry)}, właściciel ${p.brandOwner}, kapitał ${countryName(p.capitalCountry)}. ${p.capitalNote}`,
    urlPath: `/p/${p.slug}/`,
    body,
  });
}

// ---------- strona kraju ----------
function countryPage(cc, items) {
  const body = `
<h1>${flag(cc)} <span data-i18n="country.capitalFrom">Kapitał z:</span> ${esc(countryName(cc))}</h1>
<p class="lead"><span data-i18n="country.count">Liczba marek w bazie:</span> ${items.length}</p>
<div class="grid">
${items.map(productCard).join('\n')}
</div>`;
  return page({
    title: `Marki z kapitałem: ${countryName(cc)} | SkądTo?`,
    desc: `Które marki w polskich sklepach mają kapitał z kraju: ${countryName(cc)}? Lista: ${items.map(p => p.brand).join(', ')}.`,
    urlPath: `/kraj/${cc.toLowerCase()}/`,
    body,
  });
}

// ---------- index ----------
function indexPage() {
  const maxCount = statsSorted[0][1];
  const bars = statsSorted.map(([cc, n]) =>
    `<a class="bar-row" href="/kraj/${cc.toLowerCase()}/">
      <span class="bar-label">${flag(cc)} ${esc(countryName(cc))}</span>
      <span class="bar-track"><span class="bar-fill${cc === 'PL' ? ' bar-pl' : ''}" style="width:${Math.round(n / maxCount * 100)}%"></span></span>
      <span class="bar-num">${n}</span>
    </a>`).join('\n');
  const cats = [...new Set(products.map(p => p.category))].sort((a, b) => a.localeCompare(b, 'pl'));
  const body = `
<section class="hero">
  <h1 data-i18n="hero.title">Skąd naprawdę pochodzi to, co kupujesz?</h1>
  <p class="lead" data-i18n="hero.sub">Kraj produkcji · producent · właściciel marki · pochodzenie kapitału. Publiczne dane zebrane w jednym miejscu.</p>
  <input type="search" id="search" placeholder="Szukaj marki, producenta, właściciela…" autocomplete="off">
  <div class="filters">
    <button class="chip chip-on" data-filter="*" data-i18n="filter.all">wszystkie</button>
    ${statsSorted.map(([cc]) => `<button class="chip" data-filter="${cc}">${flag(cc)} ${esc(countryName(cc))}</button>`).join('\n    ')}
  </div>
  <div class="filters filters-cat">
    ${cats.map(c => `<button class="chip chip-cat" data-cat="${esc(c)}">${esc(c)}</button>`).join('\n    ')}
  </div>
</section>
<div class="grid" id="grid">
${products.map(productCard).join('\n')}
</div>
<p id="no-results" class="hidden" data-i18n="search.none">Brak wyników. Brakuje produktu? <a href="/metodologia/#zglos">Zgłoś go</a>.</p>
<section class="stats-teaser">
  <h2 data-i18n="stats.title">Skąd pochodzi kapitał marek w bazie?</h2>
  <div class="bars">${bars}</div>
  <p><a href="/statystyki/" data-i18n="stats.more">Zobacz pełne statystyki →</a></p>
</section>`;
  return page({
    title: 'SkądTo? — sprawdź, skąd naprawdę pochodzi produkt',
    desc: 'Kraj produkcji, producent, właściciel marki i pochodzenie kapitału — publiczne dane o markach z polskich sklepów zebrane w jednym miejscu.',
    urlPath: '/',
    body,
  });
}

// ---------- statystyki ----------
function statsPage() {
  const total = products.length;
  const maxCount = statsSorted[0][1];
  const bars = statsSorted.map(([cc, n]) =>
    `<a class="bar-row" href="/kraj/${cc.toLowerCase()}/">
      <span class="bar-label">${flag(cc)} ${esc(countryName(cc))}</span>
      <span class="bar-track"><span class="bar-fill${cc === 'PL' ? ' bar-pl' : ''}" style="width:${Math.round(n / maxCount * 100)}%"></span></span>
      <span class="bar-num">${n} (${Math.round(n / total * 100)}%)</span>
    </a>`).join('\n');
  const madeInPL = products.filter(p => p.productionCountry === 'PL').length;
  const plCapital = capitalStats['PL'] || 0;
  const body = `
<h1 data-i18n="stats.title">Skąd pochodzi kapitał marek w bazie?</h1>
<p class="lead"><span data-i18n="stats.base">Baza:</span> ${total} <span data-i18n="stats.records">rekordów</span> · <span data-i18n="stats.date">stan:</span> ${BUILD_DATE}</p>
<div class="big-nums">
  <div class="big-num"><strong>${Math.round(madeInPL / total * 100)}%</strong><span data-i18n="stats.madePL">produkowane w Polsce</span></div>
  <div class="big-num"><strong>${Math.round(plCapital / total * 100)}%</strong><span data-i18n="stats.capitalPL">z polskim kapitałem</span></div>
</div>
<p class="lead" data-i18n="stats.gap">Ta różnica to sedno serwisu: „wyprodukowano w Polsce" nie znaczy „polska firma".</p>
<div class="bars">${bars}</div>
<p class="disclaimer" data-i18n="stats.disclaimer">Statystyki dotyczą wyłącznie marek obecnych w bazie — nie są reprezentatywne dla całego rynku. Baza rośnie z każdą aktualizacją.</p>`;
  return page({
    title: 'Statystyki pochodzenia kapitału | SkądTo?',
    desc: `Ile marek z polskich sklepów ma polski kapitał? ${Math.round(madeInPL / total * 100)}% produkcji w PL, ale tylko ${Math.round(plCapital / total * 100)}% polskiego kapitału.`,
    urlPath: '/statystyki/',
    body,
  });
}

// ---------- metodologia ----------
function methodPage() {
  const body = `
<h1 data-i18n="method.title">Metodologia i źródła</h1>
<h2>Co pokazujemy</h2>
<p>Dla każdej marki zbieramy z publicznych źródeł: <strong>kraj produkcji</strong> (gdzie fizycznie powstaje produkt), <strong>producenta</strong> (podmiot z etykiety), <strong>właściciela marki</strong> (do kogo należy znak towarowy / spółka) i <strong>pochodzenie kapitału</strong> (kto ostatecznie kontroluje właściciela).</p>
<h2>Skąd bierzemy dane</h2>
<ul>
  <li><strong>Etykiety produktów</strong> — producent, adres zakładu, owalny kod weterynaryjny (np. „PL 12345678 WE" = konkretny zakład w Polsce, do sprawdzenia w rejestrze GIW).</li>
  <li><strong>Rejestry publiczne</strong> — KRS (<a href="https://ekrs.ms.gov.pl" rel="nofollow">ekrs.ms.gov.pl</a>, <a href="https://rejestr.io" rel="nofollow">rejestr.io</a>), sprawozdania finansowe, struktura udziałowców.</li>
  <li><strong>Relacje inwestorskie i raporty roczne</strong> spółek giełdowych.</li>
  <li><strong>Strony producentów i komunikaty prasowe</strong> (przejęcia, sprzedaże marek).</li>
</ul>
<h2>Ograniczenia</h2>
<ul>
  <li>Struktury własnościowe się zmieniają — każdy rekord ma datę „stan na" i listę źródeł. Sprawdź je przed podjęciem decyzji.</li>
  <li>„Kraj produkcji" bywa różny dla różnych wariantów tego samego produktu — rozstrzyga etykieta konkretnego opakowania.</li>
  <li>Rekordy oznaczone <span class="badge-verify">⚠ do weryfikacji</span> wymagają dodatkowego potwierdzenia.</li>
  <li>Serwis ma charakter informacyjno-edukacyjny. Nie wartościujemy — pokazujemy fakty, decyzja należy do Ciebie.</li>
</ul>
<h2 id="zglos">Zgłoś poprawkę lub nowy produkt</h2>
<p>Widzisz błąd albo brakuje Ci produktu? Napisz: <a href="mailto:k.holda@silsense.pl?subject=SkadTo%20-%20poprawka">k.holda@silsense.pl</a>. Podaj markę, dane z etykiety i — jeśli możesz — link do źródła. Każde zgłoszenie weryfikujemy przed publikacją.</p>
<h2>Licencja</h2>
<p>Kod i treści: PolyForm Noncommercial 1.0.0 — Required Notice: Copyright Kacper (2026). Dane faktograficzne pochodzą ze źródeł publicznych.</p>`;
  return page({
    title: 'Metodologia i źródła | SkądTo?',
    desc: 'Jak zbieramy dane o pochodzeniu produktów: etykiety, KRS, raporty roczne, rejestry. Ograniczenia i sposób zgłaszania poprawek.',
    urlPath: '/metodologia/',
    body,
  });
}

// ---------- assets ----------
const CSS = `:root{--bg:#f7f6f3;--card:#ffffff;--ink:#1c2126;--muted:#68737e;--line:#e3e0da;--accent:#c8571f;--pl:#2e9e5b;--foreign:#e05252;--radius:12px}
*{box-sizing:border-box}
body{margin:0;font-family:'Segoe UI',system-ui,Arial,sans-serif;background:var(--bg);color:var(--ink);line-height:1.55}
a{color:inherit}
main{max-width:1000px;margin:0 auto;padding:0 20px 60px}
.site-header{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;max-width:1000px;margin:0 auto;padding:18px 20px}
.logo{font-size:1.5rem;font-weight:800;text-decoration:none}
.logo .accent{color:var(--accent)}
.site-header nav{display:flex;gap:16px;align-items:center}
.site-header nav a{text-decoration:none;color:var(--muted);font-weight:600}
.site-header nav a:hover{color:var(--ink)}
.lang-btn{border:1px solid var(--line);background:var(--card);border-radius:8px;padding:4px 10px;cursor:pointer;font-weight:700;color:var(--muted)}
.hero{text-align:center;padding:34px 0 10px}
.hero h1{font-size:clamp(1.6rem,4vw,2.4rem);margin:0 0 8px}
.lead{color:var(--muted);max-width:640px;margin:0 auto 20px}
#search{width:100%;max-width:560px;padding:14px 18px;font-size:1.05rem;border:2px solid var(--line);border-radius:999px;outline:none;background:var(--card)}
#search:focus{border-color:var(--accent)}
.filters{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:16px 0 4px}
.chip{border:1px solid var(--line);background:var(--card);border-radius:999px;padding:6px 14px;cursor:pointer;font-size:.9rem;color:var(--muted)}
.chip-on{background:var(--ink);color:#fff;border-color:var(--ink)}
.chip-cat.chip-on{background:var(--accent);border-color:var(--accent)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-top:24px}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:16px;text-decoration:none;display:flex;flex-direction:column;gap:8px;transition:transform .12s,box-shadow .12s}
.card:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.07)}
.card-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.card h3{margin:0;font-size:1.1rem}
.cat{font-size:.75rem;color:var(--muted);background:var(--bg);border-radius:6px;padding:2px 8px;white-space:nowrap}
.card-flags{display:flex;align-items:center;gap:8px;font-size:.92rem}
.card-flags small{display:block;color:var(--muted);font-size:.7rem;text-transform:uppercase}
.arrow{color:var(--muted)}
.card-owner{margin:0;color:var(--muted);font-size:.88rem}
.badge-verify{font-size:.75rem;color:#9a6700;background:#fff3cd;border-radius:6px;padding:2px 8px;align-self:flex-start}
.hidden{display:none}
#no-results{text-align:center;color:var(--muted);margin-top:30px}
.stats-teaser{margin-top:50px;background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:24px}
.bars{display:flex;flex-direction:column;gap:8px;margin-top:14px}
.bar-row{display:grid;grid-template-columns:170px 1fr 70px;gap:10px;align-items:center;text-decoration:none;font-size:.92rem}
.bar-track{background:var(--bg);border-radius:6px;height:20px;overflow:hidden}
.bar-fill{display:block;height:100%;background:var(--foreign);border-radius:6px}
.bar-fill.bar-pl{background:var(--pl)}
.bar-num{color:var(--muted);text-align:right}
.big-nums{display:flex;gap:16px;flex-wrap:wrap;margin:20px 0}
.big-num{flex:1;min-width:200px;background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:20px;text-align:center}
.big-num strong{display:block;font-size:2.4rem;color:var(--accent)}
.product h1{margin-bottom:4px}
.flags-inline{font-size:1.2rem}
.crumbs{margin:20px 0 0}
.crumbs a{color:var(--muted);text-decoration:none}
.verify-banner{background:#fff3cd;color:#9a6700;border-radius:8px;padding:10px 14px}
.chain{display:flex;flex-wrap:wrap;gap:6px;align-items:stretch;margin:20px 0}
.chain-step{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 14px;flex:1;min-width:130px}
.chain-step small{display:block;color:var(--muted);text-transform:uppercase;font-size:.68rem}
.chain-final{border-color:var(--accent)}
.chain-arrow{align-self:center;color:var(--muted)}
table.facts{width:100%;border-collapse:collapse;margin:16px 0;background:var(--card);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden}
table.facts th,table.facts td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--line);vertical-align:top}
table.facts th{width:200px;color:var(--muted);font-weight:600}
table.facts tr:last-child th,table.facts tr:last-child td{border-bottom:none}
.sources li{margin:4px 0}
.share-card{max-width:360px;border-radius:var(--radius);overflow:hidden;margin:10px 0}
.share-card svg{display:block;width:100%;height:auto}
.btn{background:var(--accent);color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:1rem;cursor:pointer;font-weight:600}
.btn:hover{opacity:.9}
.disclaimer{color:var(--muted);font-size:.85rem;margin-top:24px}
.site-footer{max-width:1000px;margin:0 auto;padding:24px 20px;border-top:1px solid var(--line);color:var(--muted);font-size:.82rem}
@media(max-width:600px){.bar-row{grid-template-columns:120px 1fr 60px}.chain{flex-direction:column}.chain-arrow{transform:rotate(90deg);align-self:flex-start;margin-left:20px}}`;

const APP_JS = `(function(){
'use strict';
// ---------- i18n ----------
var I18N = {
  en: {
    'nav.home':'Database','nav.stats':'Statistics','nav.method':'Methodology','nav.back':'all products',
    'hero.title':'Where does what you buy really come from?',
    'hero.sub':'Country of production, manufacturer, brand owner, origin of capital. Public data gathered in one place.',
    'filter.all':'all','search.none':'No results. Missing a product? Report it.',
    'card.made':'made in','card.capital':'capital','card.verify':'⚠ needs verification',
    'chain.brand':'brand','chain.producer':'producer','chain.owner':'owner','chain.capital':'capital',
    'field.brand':'Brand','field.category':'Category','field.producer':'Producer','field.madeIn':'Country of production','field.plants':'Plants / locations','field.owner':'Brand owner','field.ownerCountry':'Owner country','field.capital':'Origin of capital','field.updated':'As of',
    'product.sources':'Sources','product.share':'Shareable card','product.download':'Download PNG',
    'product.verify':'⚠ Marked as "needs verification" — confirm with sources before citing.',
    'product.disclaimer':'All information comes from public sources and is educational. Represent this brand and see an error? Report a correction.',
    'stats.title':'Where does the capital behind these brands come from?','stats.more':'See full statistics →',
    'stats.base':'Database:','stats.records':'records','stats.date':'as of:','stats.madePL':'made in Poland','stats.capitalPL':'Polish capital',
    'stats.gap':'This gap is the point of this site: "made in Poland" does not mean "Polish company".',
    'stats.disclaimer':'Statistics cover only brands in this database — not the whole market. The database grows with every update.',
    'country.capitalFrom':'Capital from:','country.count':'Brands in database:',
    'method.title':'Methodology and sources',
    'footer.disclaimer':'Data gathered from public sources (labels, registries, company pages, press). May be outdated — always check the sources listed with each product. Informational and educational service, not shopping advice.',
    'footer.updated':'updated:','footer.report':'report a correction'
  }
};
var lang = localStorage.getItem('skadto-lang') || ((navigator.language||'pl').slice(0,2)==='pl' ? 'pl' : 'en');
var plTexts = {};
function applyLang(){
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var k = el.getAttribute('data-i18n');
    if(!(k in plTexts)) plTexts[k] = el.innerHTML;
    if(lang==='en' && I18N.en[k]) el.textContent = I18N.en[k];
    else el.innerHTML = plTexts[k];
  });
  var btn = document.getElementById('lang-toggle');
  if(btn) btn.textContent = lang==='pl' ? 'EN' : 'PL';
  document.documentElement.lang = lang;
}
var toggle = document.getElementById('lang-toggle');
if(toggle) toggle.addEventListener('click', function(){
  lang = lang==='pl' ? 'en' : 'pl';
  localStorage.setItem('skadto-lang', lang);
  applyLang();
});
applyLang();

// ---------- szukajka + filtry ----------
var search = document.getElementById('search');
var grid = document.getElementById('grid');
if(search && grid){
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
  var capFilter = '*', catFilter = null;
  function refresh(){
    var q = search.value.trim().toLowerCase();
    var visible = 0;
    cards.forEach(function(c){
      var ok = (capFilter==='*' || c.dataset.capital===capFilter)
        && (!catFilter || c.dataset.category===catFilter)
        && (!q || c.dataset.search.indexOf(q)!==-1);
      c.classList.toggle('hidden', !ok);
      if(ok) visible++;
    });
    document.getElementById('no-results').classList.toggle('hidden', visible>0);
  }
  search.addEventListener('input', refresh);
  document.querySelectorAll('.chip[data-filter]').forEach(function(ch){
    ch.addEventListener('click', function(){
      capFilter = ch.dataset.filter;
      document.querySelectorAll('.chip[data-filter]').forEach(function(x){x.classList.toggle('chip-on', x===ch);});
      refresh();
    });
  });
  document.querySelectorAll('.chip-cat').forEach(function(ch){
    ch.addEventListener('click', function(){
      catFilter = (catFilter===ch.dataset.cat) ? null : ch.dataset.cat;
      document.querySelectorAll('.chip-cat').forEach(function(x){x.classList.toggle('chip-on', x.dataset.cat===catFilter);});
      refresh();
    });
  });
}

// ---------- pobieranie karty PNG ----------
var dl = document.getElementById('dl-card');
if(dl) dl.addEventListener('click', function(){
  var svg = document.querySelector('#share-card svg');
  var xml = new XMLSerializer().serializeToString(svg);
  var img = new Image();
  img.onload = function(){
    var canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1350;
    canvas.getContext('2d').drawImage(img, 0, 0, 1080, 1350);
    var a = document.createElement('a');
    a.download = 'skadto-' + dl.dataset.slug + '.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
});
})();`;

// ---------- zapis ----------
function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

fs.rmSync(OUT, { recursive: true, force: true });
write('index.html', indexPage());
write('statystyki/index.html', statsPage());
write('metodologia/index.html', methodPage());
write('assets/style.css', CSS);
write('assets/app.js', APP_JS);

const urls = ['/', '/statystyki/', '/metodologia/'];
for (const p of products) {
  write(`p/${p.slug}/index.html`, productPage(p));
  urls.push(`/p/${p.slug}/`);
}
for (const [cc] of statsSorted) {
  write(`kraj/${cc.toLowerCase()}/index.html`, countryPage(cc, products.filter(p => p.capitalCountry === cc)));
  urls.push(`/kraj/${cc.toLowerCase()}/`);
}
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url><loc>${SITE_URL}${u}</loc><lastmod>${BUILD_DATE}</lastmod></url>`).join('\n')}
</urlset>`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
write('_headers', `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`);

console.log(`OK: ${products.length} produktów, ${urls.length} stron → public/ (${SITE_URL})`);
