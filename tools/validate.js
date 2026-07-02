#!/usr/bin/env node
/* Walidacja data/products.json — uruchamiana przed każdym buildem/publikacją. */
'use strict';
const fs = require('fs');
const path = require('path');

const REQUIRED = ['slug', 'brand', 'category', 'producer', 'productionCountry', 'plants', 'brandOwner', 'ownerCountry', 'capitalCountry', 'capitalNote', 'story', 'sources', 'confidence', 'updated'];
const CC = /^[A-Z]{2}$/;
const CONF = ['publiczne', 'do-weryfikacji'];

const db = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'products.json'), 'utf8'));
const errors = [];
const slugs = new Set();

db.products.forEach((p, i) => {
  const id = p.slug || `#${i}`;
  for (const f of REQUIRED) if (p[f] === undefined || p[f] === '') errors.push(`${id}: brak pola "${f}"`);
  if (p.slug && slugs.has(p.slug)) errors.push(`${id}: zdublowany slug`);
  slugs.add(p.slug);
  if (p.slug && !/^[a-z0-9-]+$/.test(p.slug)) errors.push(`${id}: slug tylko [a-z0-9-]`);
  for (const f of ['productionCountry', 'ownerCountry', 'capitalCountry'])
    if (p[f] && !CC.test(p[f])) errors.push(`${id}: ${f}="${p[f]}" — wymagany kod ISO-2 (wielkie litery)`);
  if (p.confidence && !CONF.includes(p.confidence)) errors.push(`${id}: confidence musi być jednym z: ${CONF.join(', ')}`);
  if (!Array.isArray(p.sources) || p.sources.length === 0) errors.push(`${id}: wymagane min. 1 źródło`);
  else p.sources.forEach((s, j) => {
    if (!s.label || !s.url) errors.push(`${id}: źródło #${j} bez label/url`);
    if (s.url && !/^https?:\/\//.test(s.url)) errors.push(`${id}: źródło #${j} — url musi zaczynać się od http(s)`);
  });
  if (p.updated && !/^\d{4}-\d{2}-\d{2}$/.test(p.updated)) errors.push(`${id}: updated w formacie YYYY-MM-DD`);
});

if (errors.length) {
  console.error(`BŁĘDY (${errors.length}):`);
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
}
const toVerify = db.products.filter(p => p.confidence === 'do-weryfikacji').map(p => p.slug);
console.log(`OK: ${db.products.length} rekordów poprawnych.`);
if (toVerify.length) console.log(`Uwaga — oznaczone "do-weryfikacji" (${toVerify.length}): ${toVerify.join(', ')}`);
