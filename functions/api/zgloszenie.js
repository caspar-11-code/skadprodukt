/*
 * Backend formularza sugestii/poprawek (Cloudflare Pages Functions, free tier).
 * Zapis do KV (binding: ZGLOSZENIA). Odczyt: dashboard -> Storage & Databases -> KV, klucze "z:...".
 * Zabezpieczenia: tylko JSON, limit 16 KB, limity dlugosci pol, filtr znakow kontrolnych,
 * walidacja URL, honeypot, rate-limit 10/dzien/IP. Dane nigdy nie sa renderowane jako HTML.
 */
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });

// filtr znakow kontrolnych i formatujacych (poza \n i \t) — bez literalow regex,
// zeby kod byl czysty ASCII: NUL-US, DEL, zero-width (U+200B-200F), bidi (U+202A-202E)
function sanitize(v, max) {
  const out = [];
  for (const ch of String(v == null ? '' : v)) {
    const c = ch.codePointAt(0);
    if (c < 32 && c !== 9 && c !== 10) continue;
    if (c === 127) continue;
    if (c >= 0x200B && c <= 0x200F) continue;
    if (c >= 0x202A && c <= 0x202E) continue;
    out.push(ch);
    if (out.length >= max) break;
  }
  return out.join('').trim();
}

export async function onRequestPost({ request, env }) {
  // twarde limity wejscia: tylko JSON, max 16 KB
  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return json({ ok: false, error: 'Nieprawidłowe zgłoszenie.' }, 415);
  const len = parseInt(request.headers.get('content-length') || '0', 10);
  if (len > 16384) return json({ ok: false, error: 'Zgłoszenie za duże.' }, 413);

  let data;
  try { data = await request.json(); } catch { return json({ ok: false, error: 'Nieprawidłowe zgłoszenie.' }, 400); }
  if (!data || typeof data !== 'object') return json({ ok: false, error: 'Nieprawidłowe zgłoszenie.' }, 400);

  // honeypot — boty wypelniaja ukryte pole; udajemy sukces, nic nie zapisujemy
  if (data.website) return json({ ok: true });

  const message = sanitize(data.message, 2000);
  if (message.length < 10) return json({ ok: false, error: 'Opisz zgłoszenie (min. 10 znaków).' }, 400);

  // pole zrodla: wylacznie poprawny URL http(s)
  let source = sanitize(data.source, 500);
  if (source && !/^https?:\/\/\S+$/.test(source)) source = '';

  if (!env.ZGLOSZENIA) return json({ ok: false, error: 'Formularz chwilowo niedostępny — spróbuj później.' }, 503);

  const now = new Date().toISOString();
  const ip = request.headers.get('cf-connecting-ip') || '0';
  // limit 10 zgloszen dziennie z jednego IP (anty-spam); IP nie zapisujemy w zgloszeniu
  const rlKey = `rl:${now.slice(0, 10)}:${ip}`;
  const used = parseInt((await env.ZGLOSZENIA.get(rlKey)) || '0', 10);
  if (used >= 10) return json({ ok: false, error: 'Dzienny limit zgłoszeń wyczerpany. Spróbuj jutro.' }, 429);
  await env.ZGLOSZENIA.put(rlKey, String(used + 1), { expirationTtl: 86400 });

  const record = {
    ts: now,
    type: ['poprawka', 'nowy-produkt', 'nowe-zrodlo', 'inne'].includes(data.type) ? data.type : 'inne',
    message,
    source,
    contact: sanitize(data.contact, 200),
    page: sanitize(data.page, 300),
    country: request.headers.get('cf-ipcountry') || '',
  };
  await env.ZGLOSZENIA.put(`z:${now}:${crypto.randomUUID().slice(0, 8)}`, JSON.stringify(record));
  return json({ ok: true });
}

// pozostale metody — 405
export function onRequestGet() { return json({ ok: false, error: 'Method not allowed' }, 405); }
export function onRequestPut() { return json({ ok: false, error: 'Method not allowed' }, 405); }
export function onRequestDelete() { return json({ ok: false, error: 'Method not allowed' }, 405); }
