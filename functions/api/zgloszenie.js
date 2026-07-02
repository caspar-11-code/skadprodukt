/*
 * Backend formularza sugestii/poprawek (Cloudflare Pages Functions, free tier).
 * Zapis do KV (binding: ZGLOSZENIA, namespace tworzony w dashboardzie Pages → Settings → Bindings).
 * Odczyt zgłoszeń: dashboard Cloudflare → Storage & Databases → KV → skadprodukt-zgloszenia (klucze "z:...").
 */
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

export async function onRequestPost({ request, env }) {
  let data;
  try { data = await request.json(); } catch { return json({ ok: false, error: 'Nieprawidłowe zgłoszenie.' }, 400); }
  if (!data || typeof data !== 'object') return json({ ok: false, error: 'Nieprawidłowe zgłoszenie.' }, 400);

  // honeypot — boty wypełniają ukryte pole; udajemy sukces, nic nie zapisujemy
  if (data.website) return json({ ok: true });

  const message = String(data.message || '').trim();
  if (message.length < 10) return json({ ok: false, error: 'Opisz zgłoszenie (min. 10 znaków).' }, 400);
  if (message.length > 2000) return json({ ok: false, error: 'Zgłoszenie za długie (max 2000 znaków).' }, 400);

  if (!env.ZGLOSZENIA) return json({ ok: false, error: 'Formularz chwilowo niedostępny — spróbuj później.' }, 503);

  const now = new Date().toISOString();
  const ip = request.headers.get('cf-connecting-ip') || '0';
  // limit 10 zgłoszeń dziennie z jednego IP (anty-spam); IP nie zapisujemy w zgłoszeniu
  const rlKey = `rl:${now.slice(0, 10)}:${ip}`;
  const used = parseInt((await env.ZGLOSZENIA.get(rlKey)) || '0', 10);
  if (used >= 10) return json({ ok: false, error: 'Dzienny limit zgłoszeń wyczerpany. Spróbuj jutro.' }, 429);
  await env.ZGLOSZENIA.put(rlKey, String(used + 1), { expirationTtl: 86400 });

  const record = {
    ts: now,
    type: ['poprawka', 'nowy-produkt', 'nowe-zrodlo', 'inne'].includes(data.type) ? data.type : 'inne',
    message,
    source: String(data.source || '').slice(0, 500),
    contact: String(data.contact || '').slice(0, 200),
    page: String(data.page || '').slice(0, 300),
    country: request.headers.get('cf-ipcountry') || '',
  };
  await env.ZGLOSZENIA.put(`z:${now}:${crypto.randomUUID().slice(0, 8)}`, JSON.stringify(record));
  return json({ ok: true });
}

// pozostałe metody (GET itd.) — Pages kieruje tu wszystko, czego nie łapie onRequestPost
export function onRequestGet() { return json({ ok: false, error: 'Method not allowed' }, 405); }
export function onRequestPut() { return json({ ok: false, error: 'Method not allowed' }, 405); }
export function onRequestDelete() { return json({ ok: false, error: 'Method not allowed' }, 405); }
