#!/usr/bin/env node
/*
 * skadprodukt.org — „Skąd Produkt?" · Portal świadomego konsumenta.
 * Generator statycznego serwisu o pochodzeniu produktów, marek, kapitału i składników.
 * Zero zależności: node build.js  →  public/
 * Licencja: PolyForm Noncommercial 1.0.0, Copyright Kacper (2026)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'public');
const SITE_URL = (process.env.SITE_URL || 'https://skadprodukt.org').replace(/\/$/, '');
const SITE_NAME = 'Skąd Produkt?';
const TAGLINE = 'Portal świadomego konsumenta';
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const COUNTRIES = {
  PL: { pl: 'Polska', en: 'Poland' }, DE: { pl: 'Niemcy', en: 'Germany' }, CH: { pl: 'Szwajcaria', en: 'Switzerland' },
  US: { pl: 'USA', en: 'USA' }, NL: { pl: 'Holandia', en: 'Netherlands' }, JP: { pl: 'Japonia', en: 'Japan' },
  KR: { pl: 'Korea Płd.', en: 'South Korea' }, PT: { pl: 'Portugalia', en: 'Portugal' }, LU: { pl: 'Luksemburg', en: 'Luxembourg' },
  UA: { pl: 'Ukraina', en: 'Ukraine' }, FR: { pl: 'Francja', en: 'France' }, GB: { pl: 'Wielka Brytania', en: 'United Kingdom' },
  LT: { pl: 'Litwa', en: 'Lithuania' }, HU: { pl: 'Węgry', en: 'Hungary' }, CN: { pl: 'Chiny', en: 'China' },
  BR: { pl: 'Brazylia', en: 'Brazil' }, TR: { pl: 'Turcja', en: 'Turkey' }, MG: { pl: 'Madagaskar', en: 'Madagascar' },
  ID: { pl: 'Indonezja', en: 'Indonesia' }, MY: { pl: 'Malezja', en: 'Malaysia' }, VN: { pl: 'Wietnam', en: 'Vietnam' },
  IN: { pl: 'Indie', en: 'India' }, GH: { pl: 'Ghana', en: 'Ghana' }, CI: { pl: 'Wybrzeże K. Słoniowej', en: 'Ivory Coast' },
  RU: { pl: 'Rosja', en: 'Russia' }, TH: { pl: 'Tajlandia', en: 'Thailand' }, RS: { pl: 'Serbia', en: 'Serbia' },
  AR: { pl: 'Argentyna', en: 'Argentina' }, DK: { pl: 'Dania', en: 'Denmark' }, SE: { pl: 'Szwecja', en: 'Sweden' },
  AT: { pl: 'Austria', en: 'Austria' }, BE: { pl: 'Belgia', en: 'Belgium' }, IT: { pl: 'Włochy', en: 'Italy' },
  ES: { pl: 'Hiszpania', en: 'Spain' }, NO: { pl: 'Norwegia', en: 'Norway' }, CZ: { pl: 'Czechy', en: 'Czechia' },
  EG: { pl: 'Egipt', en: 'Egypt' }, CO: { pl: 'Kolumbia', en: 'Colombia' }, PE: { pl: 'Peru', en: 'Peru' },
  EC: { pl: 'Ekwador', en: 'Ecuador' }, SK: { pl: 'Słowacja', en: 'Slovakia' }, KW: { pl: 'Kuwejt', en: 'Kuwait' },
  HK: { pl: 'Hongkong', en: 'Hong Kong' }, XX: { pl: 'różne kraje', en: 'various countries' },
  EU: { pl: 'Unia Europejska (różne)', en: 'European Union (various)' },
};

function flag(cc) {
  if (!cc || cc === 'EU') return '🇪🇺';
  if (cc === 'XX') return '🌐';
  return String.fromCodePoint(...[...cc.toUpperCase()].map(c => 0x1f1a5 + c.charCodeAt(0)));
}
function countryName(cc, lang = 'pl') { return (COUNTRIES[cc] && COUNTRIES[cc][lang]) || cc; }
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// ==tekst== → czerwone wyróżnienie kluczowej informacji
function fmt(s) { return esc(s).replace(/==([^=]+)==/g, '<mark>$1</mark>'); }

// ---------- dane ----------
const brandDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'products.json'), 'utf8'));
const products = brandDb.products.slice().sort((a, b) => a.brand.localeCompare(b.brand, 'pl'));

let ingredients = [];
const ingPath = path.join(ROOT, 'data', 'ingredients.json');
if (fs.existsSync(ingPath)) {
  ingredients = JSON.parse(fs.readFileSync(ingPath, 'utf8')).ingredients || [];
  ingredients.sort((a, b) => a.name.localeCompare(b.name, 'pl'));
}
const ingBySlug = Object.fromEntries(ingredients.map(i => [i.slug, i]));

// statystyki kapitału
const capitalStats = {};
for (const p of products) capitalStats[p.capitalCountry] = (capitalStats[p.capitalCountry] || 0) + 1;
const statsSorted = Object.entries(capitalStats).sort((a, b) => b[1] - a[1]);
const categories = [...new Set(products.map(p => p.category))].sort((a, b) => a.localeCompare(b, 'pl'));

// ikona YouTube (inline SVG — zgodne z CSP, bez zewnętrznych zasobów)
const YT_ICON = `<svg class="yt-ico" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8zM9.5 15.5v-7L15.8 12l-6.3 3.5z"/></svg>`;

// Administrator danych (RODO art. 13). E-mail celowo NIE w statycznym HTML —
// składany przez app.js po kliknięciu (data-user/data-dom bez znaku @), więc
// scrapery i boty nie wyciągną adresu z kodu; człowiek dostaje go jednym klikiem.
const ADMIN_NAME = 'Kacper Hołda';
const EMAIL_USER = 'holda.kacper';
const EMAIL_DOM = 'outlook.com';
const mailReveal = () =>
  `<span class="mailrev" data-user="${EMAIL_USER}" data-dom="${EMAIL_DOM}" role="button" tabindex="0" data-i18n="priv.showEmail">Pokaż adres e-mail</span>`;

// ---------- szablon strony ----------
function page({ title, desc, urlPath, body, extraHead = '', bodyClass = '' }) {
  const ogImg = `${SITE_URL}/assets/og.png`;
  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE_URL}${urlPath}">
<meta name="theme-color" content="#12161b">
<meta property="og:site_name" content="${esc(SITE_NAME)} — ${esc(TAGLINE)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pl_PL">
<meta property="og:url" content="${SITE_URL}${urlPath}">
<meta property="og:image" content="${ogImg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${ogImg}">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🧭</text></svg>')}">
<link rel="preconnect" href="${SITE_URL}">
<link rel="stylesheet" href="/assets/style.css">
${extraHead}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
<a class="skip" href="#main" data-i18n="a11y.skip">Przejdź do treści</a>
<header class="site-header">
  <a class="logo" href="/"><span class="logo-icon">🧭</span> Skąd<span class="accent">Produkt</span>?</a>
  <nav>
    <a href="/marki/" data-i18n="nav.brands">Marki</a>
    <a href="/skladniki/" data-i18n="nav.ingredients">Składniki</a>
    <a href="/statystyki/" data-i18n="nav.stats">Statystyki</a>
    <a href="/metodologia/" data-i18n="nav.method">Metodologia</a>
    <a class="yt-btn" href="https://www.youtube.com/@skadprodukt" target="_blank" rel="noopener" title="Nasz kanał YouTube" aria-label="YouTube @skadprodukt">${YT_ICON}</a>
    <button id="lang-toggle" class="lang-btn" title="PL / EN" aria-label="Language">EN</button>
  </nav>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <p><strong>${esc(SITE_NAME)}</strong> — ${esc(TAGLINE)}. <span data-i18n="footer.disclaimer">Serwis informacyjno-edukacyjny. Dane pochodzą z publicznych źródeł (etykiety, rejestry KRS, raporty instytucji, publikacje prasowe) — przy każdej informacji podajemy źródło. Struktury własności i pochodzenie surowców zmieniają się w czasie; przed powołaniem się na dane sprawdź źródło i jego datę.</span></p>
  <p><a href="/zglos/" data-i18n="footer.report">Zgłoś poprawkę lub sugestię</a> · <a href="/metodologia/" data-i18n="footer.method">Metodologia i źródła</a> · <a href="/prywatnosc/" data-i18n="footer.privacy">Prywatność i cookies</a> · <a href="/o-serwisie/" data-i18n="footer.about">O serwisie</a> · <a class="yt-link" href="https://www.youtube.com/@skadprodukt" target="_blank" rel="noopener">${YT_ICON} YouTube: @skadprodukt</a></p>
  <p class="fine">© skadprodukt.org 2026 · PolyForm Noncommercial 1.0.0 · <span data-i18n="footer.updated">aktualizacja:</span> ${BUILD_DATE} · <span data-i18n="footer.mapcredit">mapa:</span> <a href="https://www.amcharts.com/" rel="nofollow noopener" target="_blank">amCharts</a></p>
</footer>
<div id="info-note" class="info-note hidden" role="region" aria-label="Informacja o prywatności">
  <p data-i18n="note.text">Ta strona zapisuje wyłącznie Twój wybór języka i korzysta z technicznych plików hostingu (Cloudflare). Nie zbieramy danych analitycznych ani marketingowych, nie śledzimy Cię.</p>
  <div class="info-note-act">
    <a href="/prywatnosc/" class="note-link" data-i18n="note.more">Szczegóły</a>
    <button id="info-ok" class="btn btn-sm" data-i18n="note.ok">Rozumiem</button>
  </div>
</div>
<script src="/assets/app.js"></script>
</body>
</html>`;
}

// ---------- komponenty ----------
function brandCard(p) {
  const foreign = p.capitalCountry !== 'PL';
  return `<a class="card${foreign ? ' card-foreign' : ' card-pl'}" href="/p/${p.slug}/" data-search="${esc((p.brand + ' ' + p.producer + ' ' + p.brandOwner + ' ' + p.category).toLowerCase())}" data-capital="${p.capitalCountry}" data-category="${esc(p.category)}">
  <div class="card-head"><h3>${esc(p.brand)}</h3><span class="cat">${esc(p.category)}</span></div>
  <div class="card-flags">
    <span title="Kraj produkcji"><small data-i18n="card.made">produkcja</small> ${flag(p.productionCountry)} ${esc(countryName(p.productionCountry))}</span>
    <span class="arrow">→</span>
    <span title="Pochodzenie kapitału"><small data-i18n="card.capital">kapitał</small> ${flag(p.capitalCountry)} ${esc(countryName(p.capitalCountry))}</span>
  </div>
  <p class="card-owner">${esc(p.brandOwner)}</p>
  <div class="card-badges">
    ${p.stateAid ? '<span class="badge-aid" data-i18n="card.aid">💰 udokumentowane wsparcie państwa</span>' : ''}
    ${p.confidence === 'do-weryfikacji' ? '<span class="badge-verify" data-i18n="card.verify">⚠ do weryfikacji</span>' : ''}
  </div>
</a>`;
}

function ingredientCard(ing) {
  const origins = (ing.originCountries || []).slice(0, 4).map(o => flag(o.cc)).join(' ');
  return `<a class="card card-ing" href="/skladnik/${ing.slug}/" data-search="${esc((ing.name + ' ' + (ing.usedIn || []).join(' ')).toLowerCase())}">
  <div class="card-head"><h3>${ing.emoji ? ing.emoji + ' ' : ''}${esc(ing.name)}</h3></div>
  <div class="ing-origins">${origins}</div>
  <p class="card-owner">${esc((ing.usedIn || []).slice(0, 3).join(', '))}</p>
  <div class="card-badges">
    ${ing.paradox ? '<span class="badge-paradox" data-i18n="card.paradox">paradoks półki</span>' : ''}
    ${ing.issues && ing.issues.length ? `<span class="badge-issue">${ing.issues.length} <span data-i18n="card.issues">zagadnień</span></span>` : ''}
  </div>
</a>`;
}

// ---------- karta social SVG (1080x1350) ----------
function shareSVG(p) {
  const polish = p.capitalCountry === 'PL';
  const accent = polish ? '#2e9e5b' : '#e0644b';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" font-family="Segoe UI, Arial, sans-serif">
<rect width="1080" height="1350" fill="#12161b"/>
<rect x="0" y="0" width="1080" height="14" fill="${accent}"/>
<text x="70" y="130" font-size="46" fill="#8a94a0">🧭 SkądProdukt.org</text>
<text x="70" y="185" font-size="30" fill="#5a626b">Portal świadomego konsumenta</text>
<text x="70" y="330" font-size="92" font-weight="bold" fill="#ffffff">${esc(p.brand).slice(0, 22)}</text>
<text x="70" y="400" font-size="42" fill="#8a94a0">${esc(p.category)}</text>
<text x="70" y="560" font-size="42" fill="#8a94a0">PRODUKCJA</text>
<text x="70" y="645" font-size="68" fill="#ffffff">${flag(p.productionCountry)} ${esc(countryName(p.productionCountry))}</text>
<text x="70" y="800" font-size="42" fill="#8a94a0">WŁAŚCICIEL MARKI</text>
<text x="70" y="880" font-size="54" fill="#ffffff">${esc(p.brandOwner).slice(0, 40)}</text>
<text x="70" y="1040" font-size="42" fill="#8a94a0">POCHODZENIE KAPITAŁU</text>
<text x="70" y="1125" font-size="72" font-weight="bold" fill="${accent}">${flag(p.capitalCountry)} ${esc(countryName(p.capitalCountry))}</text>
<text x="70" y="1285" font-size="34" fill="#5a626b">skadprodukt.org · stan: ${esc(p.updated)}</text>
</svg>`;
}

// ---------- źródła (wspólny renderer) ----------
function sourceItem(s) {
  const date = s.sourceDate ? ` <span class="src-date">(${esc(s.sourceDate)})</span>` : '';
  const url = s.sourceUrl || s.url;
  const label = s.sourceLabel || s.label;
  return `<li><a href="${esc(url)}" rel="nofollow noopener" target="_blank">${esc(label)}</a>${date}</li>`;
}

// ---------- strona marki ----------
function productPage(p) {
  const rows = [
    ['Marka', 'field.brand', esc(p.brand)],
    ['Kategoria', 'field.category', esc(p.category)],
    ['Producent', 'field.producer', esc(p.producer)],
    ['Kraj produkcji', 'field.madeIn', `${flag(p.productionCountry)} ${esc(countryName(p.productionCountry))}`],
    ['Zakłady / lokalizacje', 'field.plants', esc(p.plants.join('; '))],
    ['Właściciel marki', 'field.owner', esc(p.brandOwner)],
    ['Kraj właściciela', 'field.ownerCountry', `${flag(p.ownerCountry)} ${esc(countryName(p.ownerCountry))}`],
    ['Pochodzenie kapitału', 'field.capital', `${flag(p.capitalCountry)} ${esc(countryName(p.capitalCountry))}`],
  ];
  const stakesBlock = (p.stakes && p.stakes.length) ? `
  <h2 data-i18n="product.stakes">Powiązania kapitałowe</h2>
  <p class="muted" data-i18n="product.stakesLead">Kto realnie ma udziały — wbrew „narodowym" etykietkom.</p>
  <table class="facts stakes-table">
    ${p.stakes.map(s => `<tr><th>${esc(s.holder)} ${flag(s.holderCountry)}</th><td>${s.pct ? `<strong>${esc(s.pct)}</strong> — ` : ''}${fmt(s.note)}</td></tr>`).join('\n    ')}
  </table>` : '';
  const aidBlock = p.stateAid ? `
  <aside class="state-aid">
    <span class="aid-tag" data-i18n="product.aidTag">💰 UDOKUMENTOWANE WSPARCIE PAŃSTWA</span>
    <p>${fmt(p.stateAid.text)}</p>
    <p class="issue-src"><span data-i18n="ing.source">źródło:</span> ${(p.stateAid.sources || []).map(s => `<a href="${esc(s.url)}" rel="nofollow noopener" target="_blank">${esc(s.label)}</a>`).join(' · ')}${p.stateAid.sourceDate ? ` (${esc(p.stateAid.sourceDate)})` : ''}</p>
  </aside>` : '';
  const ingBlock = (p.ingredients && p.ingredients.length) ? `
  <h2 data-i18n="product.ingredients">Kluczowe składniki</h2>
  <div class="chips-row">${p.ingredients.filter(s => ingBySlug[s]).map(s => `<a class="chip-link" href="/skladnik/${s}/">${ingBySlug[s].emoji || ''} ${esc(ingBySlug[s].name)}</a>`).join(' ')}</div>` : '';
  const body = `
<article class="product">
  <p class="crumbs"><a href="/marki/">← <span data-i18n="nav.backBrands">wszystkie marki</span></a></p>
  <h1>${esc(p.brand)} <span class="flags-inline">${flag(p.productionCountry)}→${flag(p.capitalCountry)}</span></h1>
  <p class="lead">${fmt(p.capitalNote)}</p>
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
    ${rows.map(([label, key, val]) => `<tr><th data-i18n="${key}">${esc(label)}</th><td>${val}</td></tr>`).join('\n    ')}
    <tr><th data-i18n="field.updated">Stan na</th><td>${esc(p.updated)}</td></tr>
  </table>
  ${stakesBlock}
  ${aidBlock}
  ${ingBlock}
  <h2 data-i18n="product.sources">Źródła</h2>
  <ul class="sources">
    ${p.sources.map(sourceItem).join('\n    ')}
  </ul>
  <h2 data-i18n="product.share">Karta do udostępnienia</h2>
  <div class="share-card" id="share-card">${shareSVG(p)}</div>
  <button class="btn" id="dl-card" data-slug="${p.slug}" data-i18n="product.download">Pobierz PNG</button>
  <p class="disclaimer"><span data-i18n="product.disclaimer">Informacje z publicznych źródeł, charakter edukacyjny. Widzisz błąd?</span> <a href="/zglos/" data-i18n="product.reportLink">Zgłoś poprawkę</a>.</p>
</article>`;
  return page({
    title: `${p.brand} — skąd pochodzi, czyja to marka? | ${SITE_NAME}`,
    desc: `${p.brand}: produkcja ${countryName(p.productionCountry)}, właściciel ${p.brandOwner}, kapitał ${countryName(p.capitalCountry)}. ${p.capitalNote.replace(/==/g, '')}`,
    urlPath: `/p/${p.slug}/`,
    body,
  });
}

// ---------- strona składnika (z mapą) ----------
function ingredientPage(ing) {
  const usedByBrands = products.filter(p => (p.ingredients || []).includes(ing.slug));
  const mapData = JSON.stringify((ing.originCountries || []).map(o => ({ cc: o.cc, note: o.note || '', share: o.share || '' })));
  const originList = (ing.originCountries || []).map(o =>
    `<li><span class="occ">${flag(o.cc)} ${esc(countryName(o.cc))}</span>${o.share ? ` <span class="oshare">${esc(o.share)}</span>` : ''}<span class="onote">${esc(o.note)}</span></li>`).join('\n    ');
  const statsList = (ing.stats || []).map(s =>
    `<li class="factline"><span class="factext">${fmt(s.text)}</span><span class="factsrc"><a href="${esc(s.sourceUrl)}" rel="nofollow noopener" target="_blank">${esc(s.sourceLabel)}</a>${s.sourceDate ? ` (${esc(s.sourceDate)})` : ''}</span></li>`).join('\n    ');
  const issuesList = (ing.issues || []).map(i =>
    `<div class="issue"><h3>${esc(i.title)}</h3><p>${fmt(i.text)}</p><p class="issue-src"><span data-i18n="ing.source">źródło:</span> <a href="${esc(i.sourceUrl)}" rel="nofollow noopener" target="_blank">${esc(i.sourceLabel)}</a>${i.sourceDate ? ` (${esc(i.sourceDate)})` : ''}</p></div>`).join('\n    ');
  const paradoxBlock = ing.paradox ? `
  <aside class="paradox">
    <span class="paradox-tag" data-i18n="ing.paradox">PARADOKS PÓŁKI</span>
    <p>${fmt(ing.paradox.text)}</p>
    ${ing.paradox.sourceUrl ? `<p class="issue-src"><span data-i18n="ing.source">źródło:</span> <a href="${esc(ing.paradox.sourceUrl)}" rel="nofollow noopener" target="_blank">${esc(ing.paradox.sourceLabel)}</a>${ing.paradox.sourceDate ? ` (${esc(ing.paradox.sourceDate)})` : ''}</p>` : ''}
  </aside>` : '';
  const body = `
<article class="ingredient">
  <p class="crumbs"><a href="/skladniki/">← <span data-i18n="nav.backIng">wszystkie składniki</span></a></p>
  <h1>${ing.emoji ? ing.emoji + ' ' : ''}${esc(ing.name)}</h1>
  <p class="lead">${fmt(ing.plRelevance)}</p>
  ${ing.usedIn && ing.usedIn.length ? `<p class="muted"><span data-i18n="ing.usedIn">Spotkasz w:</span> ${esc(ing.usedIn.join(', '))}</p>` : ''}
  ${paradoxBlock}

  <h2 data-i18n="ing.map">Skąd pochodzi na świecie</h2>
  <div class="map-wrap">
    <div id="wmap-mount" data-countries='${mapData.replace(/'/g, '&#39;')}'></div>
    <div id="wmap-tooltip" class="wmap-tooltip hidden"></div>
  </div>
  <ul class="origins">
    ${originList}
  </ul>

  ${statsList ? `<h2 data-i18n="ing.stats">Liczby i fakty</h2>
  <ul class="factlist">
    ${statsList}
  </ul>` : ''}

  ${issuesList ? `<h2 data-i18n="ing.issues">Czego nie widać na etykiecie</h2>
  <div class="issues">
    ${issuesList}
  </div>` : ''}

  ${usedByBrands.length ? `<h2 data-i18n="ing.brands">Marki w bazie z tym składnikiem</h2>
  <div class="chips-row">${usedByBrands.map(p => `<a class="chip-link" href="/p/${p.slug}/">${esc(p.brand)}</a>`).join(' ')}</div>` : ''}

  <p class="disclaimer"><span data-i18n="ing.disclaimer">Zestawienie z publicznych źródeł, charakter edukacyjny. Każda liczba i każde zagadnienie ma podane źródło.</span> <a href="/zglos/" data-i18n="product.reportLink">Zgłoś poprawkę</a>.</p>
</article>`;
  return page({
    title: `${ing.name} — skąd pochodzi? Mapa, fakty, źródła | ${SITE_NAME}`,
    desc: `${ing.name}: kraje pochodzenia, dane o produkcji i imporcie, udokumentowane problemy (praca, legalność, fałszowanie) i to, czego nie widać na etykiecie. ${ing.plRelevance.replace(/==/g, '')}`.slice(0, 300),
    urlPath: `/skladnik/${ing.slug}/`,
    body,
  });
}

// ---------- strona kraju ----------
function countryPage(cc, items) {
  const body = `
<h1>${flag(cc)} <span data-i18n="country.capitalFrom">Kapitał z:</span> ${esc(countryName(cc))}</h1>
<p class="lead"><span data-i18n="country.count">Liczba marek w bazie:</span> ${items.length}</p>
<div class="grid">
${items.map(brandCard).join('\n')}
</div>`;
  return page({
    title: `Marki z kapitałem: ${countryName(cc)} | ${SITE_NAME}`,
    desc: `Które marki w polskich sklepach mają kapitał z kraju: ${countryName(cc)}? Lista: ${items.map(p => p.brand).join(', ')}.`.slice(0, 300),
    urlPath: `/kraj/${cc.toLowerCase()}/`,
    body,
  });
}

// ---------- pasek statystyk (współdzielony) ----------
function barsHtml(withPct) {
  const total = products.length;
  const maxCount = statsSorted[0][1];
  return statsSorted.map(([cc, n]) =>
    `<a class="bar-row" href="/kraj/${cc.toLowerCase()}/">
      <span class="bar-label">${flag(cc)} ${esc(countryName(cc))}</span>
      <span class="bar-track"><span class="bar-fill${cc === 'PL' ? ' bar-pl' : ''}" data-pct="${Math.round(n / maxCount * 100)}"></span></span>
      <span class="bar-num">${n}${withPct ? ` (${Math.round(n / total * 100)}%)` : ''}</span>
    </a>`).join('\n');
}

// ---------- index (hub) ----------
function indexPage() {
  const featured = products.filter(p => p.capitalCountry !== p.ownerCountry || ['wedel', 'zubrowka', 'biedronka', 'tyskie'].includes(p.slug)).slice(0, 6);
  const body = `
<section class="hero">
  <h1 data-i18n="hero.title">Skąd naprawdę pochodzi to, co kupujesz?</h1>
  <p class="tagline" data-i18n="hero.tagline">Portal świadomego konsumenta</p>
  <p class="lead" data-i18n="hero.sub">Kraj produkcji, producent, właściciel marki, pochodzenie kapitału i surowców — publiczne dane zebrane i udokumentowane w jednym miejscu. Bez emocji, bez bojkotów: same fakty ze źródłami.</p>
  <form class="search-form" role="search" action="/marki/">
    <input type="search" id="search" name="q" placeholder="Szukaj marki, producenta, właściciela…" data-i18n-ph="search.ph" autocomplete="off" aria-label="Szukaj">
  </form>
  <div class="hub-tiles">
    <a class="tile" href="/marki/"><span class="tile-ico">🏷️</span><strong data-i18n="tile.brands">Marki i kapitał</strong><span data-i18n="tile.brandsSub">${products.length} marek — kto jest właścicielem</span></a>
    <a class="tile" href="/skladniki/"><span class="tile-ico">🌍</span><strong data-i18n="tile.ing">Składniki i mapa</strong><span data-i18n="tile.ingSub">${ingredients.length} surowców — skąd pochodzą</span></a>
    <a class="tile" href="/statystyki/"><span class="tile-ico">📊</span><strong data-i18n="tile.stats">Statystyki</strong><span data-i18n="tile.statsSub">produkcja vs kapitał</span></a>
  </div>
</section>

<section class="home-sec">
  <div class="sec-head"><h2 data-i18n="home.brands">Wybrane marki</h2><a href="/marki/" data-i18n="home.allBrands">wszystkie →</a></div>
  <div class="grid">
    ${featured.map(brandCard).join('\n')}
  </div>
</section>

${ingredients.length ? `<section class="home-sec">
  <div class="sec-head"><h2 data-i18n="home.ing">Składniki na mapie świata</h2><a href="/skladniki/" data-i18n="home.allIng">wszystkie →</a></div>
  <p class="lead" data-i18n="home.ingLead">Zboże, kakao, olej palmowy, ryby… To, czego nie przeczytasz drobnym drukiem: skąd naprawdę pochodzi surowiec i co się z nim wiąże.</p>
  <div class="grid grid-ing">
    ${ingredients.slice(0, 6).map(ingredientCard).join('\n')}
  </div>
</section>` : ''}

<section class="home-sec stats-teaser">
  <h2 data-i18n="stats.title">Skąd pochodzi kapitał marek w bazie?</h2>
  <div class="bars">${barsHtml(false)}</div>
  <p><a href="/statystyki/" data-i18n="stats.more">Zobacz pełne statystyki →</a></p>
</section>`;
  return page({
    title: `${SITE_NAME} — ${TAGLINE}`,
    desc: 'Sprawdź, skąd naprawdę pochodzi produkt: kraj produkcji, właściciel marki, pochodzenie kapitału i surowców. Publiczne, udokumentowane dane o markach z polskich sklepów — portal świadomego konsumenta.',
    urlPath: '/',
    body,
  });
}

// ---------- przeglądarka marek ----------
function brandsPage() {
  const body = `
<section class="hero hero-sm">
  <h1 data-i18n="brands.title">Marki i kapitał</h1>
  <p class="lead" data-i18n="brands.sub">Kto jest właścicielem marki i skąd pochodzi kapitał. Filtruj po kraju kapitału i kategorii.</p>
  <form class="search-form" role="search" onsubmit="return false">
    <input type="search" id="search" placeholder="Szukaj marki, producenta, właściciela…" data-i18n-ph="search.ph" autocomplete="off" aria-label="Szukaj">
  </form>
  <div class="filters">
    <button class="chip chip-on" data-filter="*" data-i18n="filter.all">wszystkie</button>
    ${statsSorted.map(([cc]) => `<button class="chip" data-filter="${cc}">${flag(cc)} ${esc(countryName(cc))}</button>`).join('\n    ')}
  </div>
  <div class="filters filters-cat">
    ${categories.map(c => `<button class="chip chip-cat" data-cat="${esc(c)}">${esc(c)}</button>`).join('\n    ')}
  </div>
</section>
<div class="grid" id="grid">
${products.map(brandCard).join('\n')}
</div>
<p id="no-results" class="hidden" data-i18n="search.none">Brak wyników. Brakuje marki? <a href="/zglos/">Zgłoś ją</a>.</p>`;
  return page({
    title: `Marki i kapitał — ${products.length} marek | ${SITE_NAME}`,
    desc: 'Baza marek z polskich sklepów: właściciel, producent, kraj produkcji i pochodzenie kapitału. Wyszukiwarka i filtry.',
    urlPath: '/marki/',
    body,
  });
}

// ---------- przeglądarka składników ----------
function ingredientsPage() {
  const body = `
<section class="hero hero-sm">
  <h1 data-i18n="ing.pageTitle">Składniki i ich pochodzenie</h1>
  <p class="lead" data-i18n="ing.pageSub">Skąd na świecie pochodzą surowce w Twoim koszyku — z mapą, danymi i udokumentowanymi problemami, których nie widać na opakowaniu.</p>
  <form class="search-form" role="search" onsubmit="return false">
    <input type="search" id="search" placeholder="Szukaj składnika…" data-i18n-ph="search.phIng" autocomplete="off" aria-label="Szukaj">
  </form>
</section>
<div class="grid grid-ing" id="grid">
${ingredients.map(ingredientCard).join('\n')}
</div>
<p id="no-results" class="hidden" data-i18n="search.none2">Brak wyników.</p>`;
  return page({
    title: `Składniki i ich pochodzenie | ${SITE_NAME}`,
    desc: 'Skąd pochodzą surowce w polskich sklepach: zboże, kakao, olej palmowy, kawa, ryby, miód i więcej. Mapa świata, dane i źródła.',
    urlPath: '/skladniki/',
    body,
  });
}

// ---------- statystyki ----------
function statsPage() {
  const total = products.length;
  const madeInPL = products.filter(p => p.productionCountry === 'PL').length;
  const plCapital = capitalStats['PL'] || 0;
  const body = `
<h1 data-i18n="stats.title">Skąd pochodzi kapitał marek w bazie?</h1>
<p class="lead"><span data-i18n="stats.base">Baza:</span> ${total} <span data-i18n="stats.records">marek</span> · <span data-i18n="stats.date">stan:</span> ${BUILD_DATE}</p>
<div class="big-nums">
  <div class="big-num"><strong>${Math.round(madeInPL / total * 100)}%</strong><span data-i18n="stats.madePL">produkowane w Polsce</span></div>
  <div class="big-num"><strong>${Math.round(plCapital / total * 100)}%</strong><span data-i18n="stats.capitalPL">z polskim kapitałem</span></div>
</div>
<p class="lead" data-i18n="stats.gap">Ta różnica to sedno serwisu: „wyprodukowano w Polsce" nie znaczy „polska firma".</p>
<div class="bars">${barsHtml(true)}</div>
${ingredients.some(i => i.paradox) ? `
<h2 data-i18n="stats.paradoxTitle">Paradoksy półki sklepowej</h2>
<p class="lead" data-i18n="stats.paradoxLead">Sytuacje, w których rynek przeczy zdrowemu rozsądkowi — udokumentowane, ze źródłami.</p>
<div class="issues">
${ingredients.filter(i => i.paradox).map(i => `  <aside class="paradox">
    <span class="paradox-tag">${i.emoji || ''} ${esc(i.name)}</span>
    <p>${fmt(i.paradox.text)}</p>
    <p class="issue-src"><a href="/skladnik/${i.slug}/" data-i18n="stats.paradoxMore">pełne dane i źródła →</a></p>
  </aside>`).join('\n')}
</div>` : ''}
<p class="disclaimer" data-i18n="stats.disclaimer">Statystyki dotyczą wyłącznie marek obecnych w bazie — nie są reprezentatywne dla całego rynku. Baza rośnie z każdą aktualizacją.</p>`;
  return page({
    title: `Statystyki pochodzenia kapitału | ${SITE_NAME}`,
    desc: `Ile marek z polskich sklepów ma polski kapitał? ${Math.round(madeInPL / total * 100)}% produkcji w PL, ale tylko ${Math.round(plCapital / total * 100)}% polskiego kapitału.`,
    urlPath: '/statystyki/',
    body,
  });
}

// ---------- metodologia ----------
function methodPage() {
  const body = `
<h1 data-i18n="method.title">Metodologia i źródła</h1>
<h2 data-i18n="method.h1">Co pokazujemy</h2>
<p data-i18n="method.p1">Dla każdej marki zbieramy z publicznych źródeł: <strong>kraj produkcji</strong> (gdzie fizycznie powstaje produkt), <strong>producenta</strong>, <strong>właściciela marki</strong>, <strong>pochodzenie kapitału</strong> oraz — gdy to istotne — <strong>powiązania kapitałowe</strong> (kto ma udziały). Dla składników pokazujemy <strong>kraje pochodzenia surowca</strong> na mapie, dane o produkcji/imporcie i udokumentowane zagadnienia.</p>
<h2 data-i18n="method.h2">Skąd bierzemy dane</h2>
<ul>
  <li data-i18n="method.s1"><strong>Etykiety produktów</strong> — producent, adres zakładu, owalny kod weterynaryjny (np. „PL 12345678 WE" = konkretny zakład w Polsce, do sprawdzenia w rejestrze GIW).</li>
  <li data-i18n="method.s2"><strong>Rejestry publiczne</strong> — KRS (ekrs.ms.gov.pl, rejestr.io), sprawozdania finansowe, struktura udziałowców.</li>
  <li data-i18n="method.s3"><strong>Dane instytucji</strong> — GUS, Eurostat, FAO, Komisja Europejska, NIK, raporty rządowe i agencji.</li>
  <li data-i18n="method.s4"><strong>Relacje inwestorskie</strong> spółek giełdowych oraz komunikaty o przejęciach.</li>
  <li data-i18n="method.s5"><strong>Renomowane media i raporty NGO</strong> — cytowane z podaniem nazwy i roku; twierdzenia przypisujemy źródłu, nie formułujemy oskarżeń od siebie.</li>
</ul>
<h2 data-i18n="method.h3">Zasady rzetelności</h2>
<ul>
  <li data-i18n="method.r1">Każda liczba i każde zagadnienie ma źródło z linkiem i datą.</li>
  <li data-i18n="method.r2">Czego nie potwierdzimy w źródle — nie publikujemy albo oznaczamy <span class="badge-verify">⚠ do weryfikacji</span>.</li>
  <li data-i18n="method.r3">Ton neutralny. Pokazujemy strukturę własności i pochodzenie surowców — nie wzywamy do bojkotu i nikogo nie oskarżamy.</li>
  <li data-i18n="method.r4">Struktury własności i łańcuchy dostaw się zmieniają — dlatego przy każdym rekordzie jest data „stan na".</li>
</ul>
<h2 data-i18n="method.h4">Zgłoś poprawkę lub nowy produkt</h2>
<p data-i18n="method.report">Widzisz błąd albo czegoś brakuje? Skorzystaj z <a href="/zglos/">formularza sugestii</a>. Każde zgłoszenie weryfikujemy w źródłach przed publikacją.</p>
<h2 data-i18n="method.h5">Licencja i dane</h2>
<p data-i18n="method.lic">Kod i treści: PolyForm Noncommercial 1.0.0 — Required Notice: Copyright Kacper (2026). Fakty pochodzą ze źródeł publicznych. Mapa świata: amCharts (darmowa licencja z atrybucją).</p>`;
  return page({
    title: `Metodologia i źródła | ${SITE_NAME}`,
    desc: 'Jak zbieramy i weryfikujemy dane o pochodzeniu produktów i składników: etykiety, KRS, FAO, Eurostat, KE, NIK, raporty i prasa. Zasady rzetelności i zgłaszanie poprawek.',
    urlPath: '/metodologia/',
    body,
  });
}

// ---------- polityka prywatności i cookies ----------
function privacyPage() {
  const body = `
<article class="legal">
  <h1 data-i18n="priv.title">Prywatność i cookies</h1>
  <p class="lead" data-i18n="priv.lead">W skrócie: nie śledzimy Cię. Nie używamy analityki, reklam ani ciasteczek marketingowych. Poniżej — dokładnie co, po co i na jakiej podstawie prawnej.</p>

  <h2 data-i18n="priv.h1">Administrator danych</h2>
  <p><span data-i18n="priv.admin">Administratorem danych osobowych przetwarzanych w związku z serwisem skadprodukt.org jest ${esc(ADMIN_NAME)}. Kontakt:</span> ${mailReveal()} <span data-i18n="priv.adminOr">lub przez</span> <a href="/zglos/" data-i18n="priv.form">formularz zgłoszeń</a>.</p>

  <h2 data-i18n="priv.h2">Co przechowujemy na Twoim urządzeniu (cookies / localStorage)</h2>
  <p data-i18n="priv.storeIntro">Serwis jest statyczny i ogranicza to do absolutnego minimum. Nie używamy Google Analytics, pikseli, reklam ani żadnych trackerów (twarda polityka CSP dopuszcza wyłącznie zasoby z naszej domeny).</p>
  <table class="facts">
    <tr><th data-i18n="priv.tWhat">Co</th><th data-i18n="priv.tPurpose">Po co</th><th data-i18n="priv.tBasis">Podstawa</th></tr>
    <tr><td><code>skadprodukt-lang</code> (localStorage)</td><td data-i18n="priv.langP">Zapamiętanie wybranego przez Ciebie języka (PL/EN) — zapisywane dopiero gdy klikniesz przełącznik.</td><td data-i18n="priv.langB">Funkcja żądana przez użytkownika — bez zgody (art. 399 ust. 3 pkt 2 PKE).</td></tr>
    <tr><td><code>skadprodukt-info-ok</code> (localStorage)</td><td data-i18n="priv.noteP">Zapamiętanie, że zamknąłeś notę informacyjną (by nie pokazywać jej ponownie).</td><td data-i18n="priv.noteB">Funkcja żądana przez użytkownika — bez zgody.</td></tr>
    <tr><td data-i18n="priv.cfC"><code>__cf_bm</code> i podobne (Cloudflare)</td><td data-i18n="priv.cfP">Techniczne pliki hostingu/zabezpieczenia (ochrona przed botami), ustawiane przez Cloudflare.</td><td data-i18n="priv.cfB">Niezbędne technicznie — bez zgody.</td></tr>
  </table>
  <p data-i18n="priv.noConsent">Dlatego <strong>nie wyświetlamy okna zgody na cookies</strong> — nie używamy żadnych plików, które takiej zgody wymagają. Reżim przechowywania informacji w urządzeniu końcowym reguluje art. 399 ustawy Prawo komunikacji elektronicznej (Dz.U. 2024 poz. 1221); nasze zastosowania mieszczą się w wyjątku „niezbędności” z ust. 3.</p>
  <p data-i18n="priv.browser">Wybrany język i zamknięcie noty możesz w każdej chwili usunąć, czyszcząc dane witryny w ustawieniach przeglądarki.</p>

  <h2 data-i18n="priv.h3">Dane z formularza zgłoszeń</h2>
  <p data-i18n="priv.formIntro">Jeśli skorzystasz z <a href="/zglos/">formularza sugestii</a>, przetwarzamy:</p>
  <ul>
    <li data-i18n="priv.f1"><strong>treść zgłoszenia</strong> i opcjonalne <strong>źródło</strong> — aby zweryfikować i poprawić dane w serwisie;</li>
    <li data-i18n="priv.f2"><strong>kontakt zwrotny</strong> (opcjonalnie, tylko jeśli sam podasz) — aby odpowiedzieć;</li>
    <li data-i18n="priv.f3"><strong>adres IP</strong> — wyłącznie po stronie serwera, na potrzeby limitu antyspamowego; nie zapisujemy go razem z treścią zgłoszenia.</li>
  </ul>
  <p data-i18n="priv.formBasis"><strong>Podstawa prawna:</strong> art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes — obsługa zgłoszenia i ochrona serwisu przed nadużyciami), a co do dobrowolnego kontaktu — art. 6 ust. 1 lit. a RODO (zgoda przez podanie danych). <strong>Retencja:</strong> zgłoszenia przechowujemy do czasu rozpatrzenia i przez rozsądny okres archiwalny, po czym je usuwamy; licznik antyspamowy z IP wygasa automatycznie po 24 godzinach.</p>
  <p data-i18n="priv.processor"><strong>Podmioty przetwarzające:</strong> serwis hostuje Cloudflare, Inc. (Cloudflare Pages i magazyn KV) — dane mogą być przetwarzane na infrastrukturze dostawcy zgodnie z jego polityką i standardowymi klauzulami ochrony danych.</p>

  <h2 data-i18n="priv.h4">Twoje prawa</h2>
  <p><span data-i18n="priv.rights">Masz prawo do: dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, sprzeciwu oraz przenoszenia danych. Możesz też wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych (<a href="https://uodo.gov.pl" rel="nofollow noopener" target="_blank">uodo.gov.pl</a>). W sprawach danych pisz na </span> ${mailReveal()}.</p>

  <p class="disclaimer"><span data-i18n="priv.updated">Dokument informacyjny, stan na</span> ${BUILD_DATE}.</p>
</article>`;
  return page({
    title: `Prywatność i cookies | ${SITE_NAME}`,
    desc: 'Polityka prywatności i cookies skadprodukt.org: nie śledzimy, brak analityki i reklam. Co przechowujemy (język, techniczne cookies), dane z formularza, podstawa prawna (RODO, PKE) i Twoje prawa.',
    urlPath: '/prywatnosc/',
    body,
  });
}

// ---------- o serwisie ----------
function aboutPage() {
  const body = `
<h1 data-i18n="about.title">O serwisie</h1>
<p class="lead" data-i18n="about.lead">${esc(SITE_NAME)} to portal świadomego konsumenta. Zbieramy rozproszone, publiczne informacje o tym, skąd naprawdę pochodzą produkty, marki, kapitał i surowce — i pokazujemy je w jednym, czytelnym miejscu.</p>
<h2 data-i18n="about.h1">Po co to robimy</h2>
<p data-i18n="about.p1">Informacje o właścicielach marek i pochodzeniu surowców są jawne, ale rozproszone: w rejestrach, raportach rocznych, drobnym druku na opakowaniach i śledztwach dziennikarskich. Przeciętny konsument ich nie zestawia. My robimy to zestawienie — ze źródłami.</p>
<h2 data-i18n="about.h2">Czym NIE jesteśmy</h2>
<p data-i18n="about.p2">Nie namawiamy do bojkotu i nie oceniamy, co jest „dobre", a co „złe". Nie służymy populistom żadnej strony — przeciwnie, pokazujemy, że rzeczywistość jest bardziej złożona: „chińska" marka bywa współwłasnością europejską, a „niemiecka" ma kapitał zza oceanu. Decyzję zostawiamy Tobie.</p>
<h2 data-i18n="about.h3">Zgłoszenia</h2>
<p data-i18n="about.p3">Reprezentujesz markę albo znasz lepsze źródło? Skorzystaj z <a href="/zglos/">formularza sugestii</a> — sprostowania traktujemy poważnie.</p>`;
  return page({
    title: `O serwisie | ${SITE_NAME}`,
    desc: 'Skąd Produkt? — portal świadomego konsumenta. Zbieramy publiczne dane o pochodzeniu produktów, marek i kapitału. Bez bojkotów i populizmu — same fakty ze źródłami.',
    urlPath: '/o-serwisie/',
    body,
  });
}

// ---------- formularz zgłoszeń ----------
function formPage() {
  const body = `
<article class="form-page">
  <h1 data-i18n="form.title">Zgłoś poprawkę lub sugestię</h1>
  <p class="lead" data-i18n="form.lead">Znalazłeś błąd, znasz lepsze źródło albo brakuje Ci marki/składnika? Napisz — każde zgłoszenie weryfikujemy w źródłach przed publikacją. Nie musisz podawać danych kontaktowych.</p>
  <form id="suggest-form" novalidate>
    <label data-i18n="form.type">Rodzaj zgłoszenia</label>
    <select name="type" id="f-type">
      <option value="poprawka" data-i18n="form.t1">Poprawka istniejących danych</option>
      <option value="nowy-produkt" data-i18n="form.t2">Nowy produkt / marka / składnik</option>
      <option value="nowe-zrodlo" data-i18n="form.t3">Lepsze / dodatkowe źródło</option>
      <option value="inne" data-i18n="form.t4">Inne</option>
    </select>
    <label data-i18n="form.msg">Treść zgłoszenia *</label>
    <textarea name="message" id="f-message" rows="6" minlength="10" maxlength="2000" required placeholder="Opisz, czego dotyczy zgłoszenie… (10–2000 znaków)"></textarea>
    <label data-i18n="form.src">Źródło (link, jeśli masz)</label>
    <input type="url" name="source" id="f-source" maxlength="500" placeholder="https://…">
    <label data-i18n="form.contact">Kontakt zwrotny (opcjonalnie)</label>
    <input type="text" name="contact" id="f-contact" maxlength="200" placeholder="e-mail lub nick — jeśli chcesz odpowiedź">
    <input type="text" name="website" id="f-website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
    <button type="submit" class="btn" id="f-submit" data-i18n="form.send">Wyślij zgłoszenie</button>
    <p id="f-status" class="form-status" role="status" aria-live="polite"></p>
  </form>
  <p class="disclaimer" data-i18n="form.note">Zgłoszenia trafiają do prywatnej skrzynki serwisu. Nie zbieramy danych, których nie podasz dobrowolnie. Zasady przetwarzania: <a href="/prywatnosc/">Prywatność i cookies</a>.</p>
</article>`;
  return page({
    title: `Zgłoś poprawkę lub sugestię | ${SITE_NAME}`,
    desc: 'Formularz sugestii: zgłoś poprawkę danych, nowy produkt lub lepsze źródło. Każde zgłoszenie weryfikujemy przed publikacją.',
    urlPath: '/zglos/',
    body,
  });
}

// ---------- assets ----------
const CSS = fs.readFileSync(path.join(ROOT, 'assets-src', 'style.css'), 'utf8');
const APP_JS = fs.readFileSync(path.join(ROOT, 'assets-src', 'app.js'), 'utf8');
const WORLD_MAP = fs.readFileSync(path.join(ROOT, 'assets-src', 'world-map.svg'), 'utf8');

// ---------- zapis ----------
function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

fs.rmSync(OUT, { recursive: true, force: true });
write('index.html', indexPage());
write('marki/index.html', brandsPage());
write('skladniki/index.html', ingredientsPage());
write('statystyki/index.html', statsPage());
write('metodologia/index.html', methodPage());
write('o-serwisie/index.html', aboutPage());
write('prywatnosc/index.html', privacyPage());
write('zglos/index.html', formPage());
write('assets/style.css', CSS);
write('assets/app.js', APP_JS);
write('assets/world-map.svg', WORLD_MAP);
// zachowaj OG jeśli istnieje z poprzedniego buildu (generowany osobno)
const ogSrc = path.join(ROOT, 'assets-src', 'og.png');
if (fs.existsSync(ogSrc)) write('assets/og.png', fs.readFileSync(ogSrc));

const urls = ['/', '/marki/', '/skladniki/', '/statystyki/', '/metodologia/', '/o-serwisie/', '/prywatnosc/', '/zglos/'];
for (const p of products) { write(`p/${p.slug}/index.html`, productPage(p)); urls.push(`/p/${p.slug}/`); }
for (const ing of ingredients) { write(`skladnik/${ing.slug}/index.html`, ingredientPage(ing)); urls.push(`/skladnik/${ing.slug}/`); }
for (const [cc] of statsSorted) {
  write(`kraj/${cc.toLowerCase()}/index.html`, countryPage(cc, products.filter(p => p.capitalCountry === cc)));
  urls.push(`/kraj/${cc.toLowerCase()}/`);
}

write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url><loc>${SITE_URL}${u}</loc><lastmod>${BUILD_DATE}</lastmod></url>`).join('\n')}
</urlset>`);
write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${SITE_URL}/sitemap.xml\n`);

// 404: obecność 404.html wyłącza fallback SPA (bez niej Pages zwraca 200 ze stroną główną
// dla KAŻDEGO nieistniejącego adresu — soft-404, złe dla SEO)
write('404.html', page({
  title: `404 — nie znaleziono | ${SITE_NAME}`,
  desc: 'Strona nie istnieje.',
  urlPath: '/404.html',
  body: `
<section class="hero">
  <h1>404 — nic tu nie ma 🧭</h1>
  <p class="lead">Ta strona nie istnieje albo zmieniła adres. Sprawdź bazę marek lub składników:</p>
  <div class="hub-tiles">
    <a class="tile" href="/marki/"><span class="tile-ico">🏷️</span><strong>Marki i kapitał</strong><span>kto jest właścicielem</span></a>
    <a class="tile" href="/skladniki/"><span class="tile-ico">🌍</span><strong>Składniki i mapa</strong><span>skąd pochodzą surowce</span></a>
    <a class="tile" href="/"><span class="tile-ico">🏠</span><strong>Strona główna</strong><span>skadprodukt.org</span></a>
  </div>
</section>`,
}));
// Uwaga: przekierowanie www→apex robi reguła Redirect Rules w strefie Cloudflare
// (Pages _redirects nie wspiera dopasowania po hoście — to składnia Netlify).

// Twarde nagłówki bezpieczeństwa (standard jak w candle/hub + backend formularza)
write('_headers', `/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), camera=(), microphone=(), interest-cohort=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  X-Permitted-Cross-Domain-Policies: none
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'

/api/*
  Cache-Control: no-store
`);

// security.txt (RFC 9116) — kontakt dla zgłoszeń bezpieczeństwa
write('.well-known/security.txt', `Contact: ${SITE_URL}/zglos/
Expires: 2027-07-01T00:00:00.000Z
Preferred-Languages: pl, en
Canonical: ${SITE_URL}/.well-known/security.txt
`);

console.log(`OK: ${products.length} marek, ${ingredients.length} składników, ${urls.length} stron → public/ (${SITE_URL})`);
