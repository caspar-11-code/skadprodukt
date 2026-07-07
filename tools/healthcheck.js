#!/usr/bin/env node
/*
 * Healthcheck całego pipeline'u skadprodukt.org — jedna komenda dla operatora.
 *   node tools/healthcheck.js
 * Sprawdza: produkcję (strona, statystyki vs baza), dane (do-weryfikacji),
 * skrypty Shorts, silnik wideo (stan, kolejka, harmonogram, log, token YT).
 * Wynik: lista [OK]/[UWAGA]/[BŁĄD] + kod wyjścia 1, gdy jest BŁĄD.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ENGINE = 'C:\\Users\\hkacp\\auto-content-engine';
const SITE = 'https://skadprodukt.org';

const out = [];
let errors = 0, warns = 0;
const ok = m => out.push('[OK]    ' + m);
const warn = m => { warns++; out.push('[UWAGA] ' + m); };
const err = m => { errors++; out.push('[BŁĄD]  ' + m); };

async function get(url) {
  const r = await fetch(url, { redirect: 'follow' });
  return { status: r.status, text: await r.text() };
}

(async () => {
  const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'products.json'), 'utf8'));
  const total = db.products.length;
  const publiczne = db.products.filter(p => p.confidence === 'publiczne');
  const doWer = db.products.filter(p => p.confidence !== 'publiczne').map(p => p.slug);

  // 1. produkcja żyje i ma aktualne statystyki
  try {
    const home = await get(SITE + '/');
    home.status === 200 ? ok(`strona główna ${SITE} (HTTP 200)`) : err(`strona główna: HTTP ${home.status}`);
    const stats = await get(SITE + '/statystyki/');
    const m = stats.text.match(/Baza:<\/span> (\d+)/);
    if (!m) warn('nie znalazłem licznika na /statystyki/ (zmiana markupu?)');
    else if (Number(m[1]) === total) ok(`statystyki na produkcji zgodne z bazą (${total} marek)`);
    else err(`statystyki na produkcji: ${m[1]} marek, w bazie: ${total} — uruchom build i push (deploy ~1 min)`);
    // próbka: strona ostatnio zaktualizowanej marki
    const last = [...db.products].sort((a, b) => String(b.updated).localeCompare(String(a.updated)))[0];
    const pp = await get(`${SITE}/p/${last.slug}/`);
    pp.status === 200 ? ok(`strona marki /p/${last.slug}/ (ostatnio aktualizowana) działa`) : err(`/p/${last.slug}/: HTTP ${pp.status}`);
  } catch (e) { err('produkcja niedostępna: ' + e.message); }

  // 2. dane
  doWer.length === 0 ? ok('wszystkie rekordy mają confidence "publiczne"')
    : warn(`rekordy do-weryfikacji (${doWer.length}): ${doWer.join(', ')} — nie trafią do Shorts ani nie powinny być cytowane`);

  // 3. skrypty Shorts zsynchronizowane z bazą
  const shortsDir = path.join(ROOT, 'output', 'shorts');
  const scripts = fs.existsSync(shortsDir) ? fs.readdirSync(shortsDir).filter(f => f.endsWith('.json')).length : 0;
  scripts >= publiczne.length ? ok(`skrypty Shorts: ${scripts} (marek publicznych: ${publiczne.length})`)
    : warn(`skryptów Shorts ${scripts} < marek publicznych ${publiczne.length} — uruchom: node tools/generate_shorts.js`);

  // 4. silnik wideo
  const state = path.join(ENGINE, 'content', 'skadprodukt_state.json');
  const kolejka = path.join(ENGINE, 'content', 'kolejka.json');
  if (fs.existsSync(state) && fs.existsSync(kolejka)) {
    const st = JSON.parse(fs.readFileSync(state, 'utf8'));
    const kq = JSON.parse(fs.readFileSync(kolejka, 'utf8')).kolejnosc;
    const next = kq.filter(s => !st.uploaded[s]).slice(0, 3);
    ok(`opublikowane przez automat: ${Object.keys(st.uploaded).length}; najbliższe w kolejce: ${next.join(' → ') || 'KOLEJKA PUSTA'}`);
    if (!next.length) warn('kolejka wyczerpana — dodaj marki albo pozycje do content/kolejka.json');
    const failed = Object.keys(st.failed || {});
    if (failed.length) warn('nieudane uploady: ' + failed.join(', '));
  } else warn('brak plików stanu silnika (content/skadprodukt_state.json / kolejka.json)');

  // 5. harmonogram Windows
  try {
    const q = execSync('schtasks /Query /TN "SkadProdukt Daily Short" /FO LIST', { encoding: 'utf8' });
    /Ready|Gotowe|Running|Uruchomiono/.test(q) ? ok('zadanie "SkadProdukt Daily Short" aktywne (co 2 dni, 12:30)')
      : warn('zadanie harmonogramu istnieje, ale nie jest w stanie Ready — sprawdź: schtasks /Query /TN "SkadProdukt Daily Short" /V');
  } catch { err('brak zadania "SkadProdukt Daily Short" w Harmonogramie zadań'); }

  // 6. log automatu — ostatni przebieg
  const log = path.join(ENGINE, 'logs', 'skadprodukt_daily.log');
  if (fs.existsSync(log)) {
    const tail = fs.readFileSync(log, 'utf8').trim().split('\n').slice(-15).join('\n');
    /OPUBLIKOWANO|dry-run/.test(tail) ? ok('ostatni wpis loga automatu wygląda zdrowo')
      : warn('sprawdź koniec loga automatu: ' + log);
  } else warn('log automatu jeszcze nie istnieje (pierwszy run: 2026-07-12 12:30)');

  // 7. token YouTube
  fs.existsSync(path.join(ENGINE, 'secrets', 'token.json'))
    ? ok('token YouTube OAuth obecny (secrets/token.json)')
    : err('BRAK tokenu YouTube — upload nie zadziała; napraw: cd ' + ENGINE + ' && .venv\\Scripts\\python.exe youtube_upload.py auth');

  console.log(out.join('\n'));
  console.log(`\nPodsumowanie: ${errors} błędów, ${warns} uwag.`);
  process.exit(errors ? 1 : 0);
})();
