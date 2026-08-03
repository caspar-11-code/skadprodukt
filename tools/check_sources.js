#!/usr/bin/env node
/*
 * Strażnik źródeł: sprawdza WSZYSTKIE sourceUrl/url w data/*.json.
 * - MARTWY (404/410, albo DNS-nieznaleziony ENOTFOUND / odmowa połączenia ECONNREFUSED) => exit 1 (czerwony run = mail)
 * - 403/429/reset/timeout połączenia (blokada botów z datacenter GitHuba) => ostrzeżenie (strona żyje, tylko nie lubi botów CI)
 * Wynik: SOURCES-REPORT.md (commitowany przez workflow) + stdout.
 * Uruchamianie: node tools/check_sources.js  (lokalnie lub w CI, Node 18+)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const UA = 'Mozilla/5.0 (compatible; SkadProduktBot/1.0; +https://skadprodukt.org/metodologia/)';

function collect() {
  const urls = []; // {url, where}
  const p = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'products.json'), 'utf8'));
  for (const b of p.products) {
    (b.sources || []).forEach(s => urls.push({ url: s.url, where: `marka:${b.slug}` }));
    if (b.stateAid) (b.stateAid.sources || []).forEach(s => urls.push({ url: s.url, where: `marka:${b.slug}/stateAid` }));
  }
  const iFile = path.join(ROOT, 'data', 'ingredients.json');
  if (fs.existsSync(iFile)) {
    const idb = JSON.parse(fs.readFileSync(iFile, 'utf8'));
    for (const ing of idb.ingredients) {
      (ing.stats || []).forEach(s => s.sourceUrl && urls.push({ url: s.sourceUrl, where: `składnik:${ing.slug}/stat` }));
      (ing.issues || []).forEach(s => s.sourceUrl && urls.push({ url: s.sourceUrl, where: `składnik:${ing.slug}/issue` }));
      if (ing.paradox && ing.paradox.sourceUrl) urls.push({ url: ing.paradox.sourceUrl, where: `składnik:${ing.slug}/paradox` });
    }
  }
  // deduplikacja po URL (zbierz wszystkie miejsca)
  const map = new Map();
  for (const u of urls) {
    if (!map.has(u.url)) map.set(u.url, []);
    map.get(u.url).push(u.where);
  }
  return map;
}

async function probe(url) {
  const attempt = async (method) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20000);
    try {
      const r = await fetch(url, { method, redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA, 'Accept-Language': 'pl,en' } });
      return r.status;
    } finally { clearTimeout(t); }
  };
  try {
    let status = await attempt('HEAD');
    if (status === 405 || status === 501 || status >= 400) status = await attempt('GET');
    return { status };
  } catch (e) {
    const code = (e && e.cause && e.cause.code) || (e && e.code) || '';
    return { status: 0, err: (e && e.message || 'network error').slice(0, 120), code };
  }
}

(async () => {
  const map = collect();
  const dead = [], warn = [], ok = [];
  // status 0 = błąd połączenia (nie HTTP). ENOTFOUND/ECONNREFUSED = domena nie istnieje / nic nie nasłuchuje => MARTWY.
  // Reset/timeout/TLS (ECONNRESET, abort itp.) = serwer żyje, ale blokuje boty z datacenter GitHuba => tylko OSTRZEŻENIE
  // (inaczej wielkie serwisy z anty-botem: lidl.pl, wedel.pl, roshen.com dają fałszywe "martwe" i czerwony run).
  const HARD_DOWN = new Set(['ENOTFOUND', 'ECONNREFUSED']);
  let i = 0;
  for (const [url, wheres] of map) {
    i++;
    const { status, err, code } = await probe(url);
    const row = { url, wheres, status, err, code };
    if (status === 404 || status === 410) dead.push(row);
    else if (status === 0) (HARD_DOWN.has(code) ? dead : warn).push(row);
    else if (status >= 400) warn.push(row); // 403/429 itp. — żyje, ale blokuje boty
    else ok.push(row);
    process.stdout.write(`[${i}/${map.size}] ${status || 'ERR'} ${url}\n`);
  }
  const date = new Date().toISOString().slice(0, 10);
  const md = [
    `# Raport źródeł — ${date}`,
    ``,
    `Sprawdzono **${map.size}** unikalnych URL-i. OK: ${ok.length} · ostrzeżenia (blokada botów itp.): ${warn.length} · **martwe: ${dead.length}**`,
    ``,
    dead.length ? `## ❌ MARTWE — do naprawy (podmień źródło lub oznacz rekord "do-weryfikacji")\n${dead.map(d => `- \`${d.status || d.err}\` ${d.url}\n  - używane w: ${d.wheres.join(', ')}`).join('\n')}` : `## ✅ Brak martwych linków`,
    ``,
    warn.length ? `## ⚠ Ostrzeżenia (strona istnieje, ale blokuje boty z datacenter — status ≥400 albo reset/timeout połączenia; sprawdź ręcznie raz na jakiś czas)\n${warn.map(d => `- \`${d.status || d.code || d.err || 'blok'}\` ${d.url} (${d.wheres.join(', ')})`).join('\n')}` : '',
    ``,
    `_Generowane automatycznie przez tools/check_sources.js (GitHub Actions, co poniedziałek)._`,
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'SOURCES-REPORT.md'), md + '\n');
  console.log(`\nRaport: SOURCES-REPORT.md — OK:${ok.length} WARN:${warn.length} DEAD:${dead.length}`);
  if (dead.length) process.exit(1);
})();
