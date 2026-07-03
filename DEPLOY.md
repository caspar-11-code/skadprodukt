# Wdrożenie SkądProdukt.org na Cloudflare Pages (0 zł + domena)

Domena **skadprodukt.org** jest już na koncie Cloudflare (account ID `2a154ac3f77283fec2b8954342fcf29c`). Pipeline jak w gamestheory.org: GitHub → Cloudflare Pages auto-deploy po pushu na `main`.

## 1. Repo na GitHub
Konto `caspar-11-code`, repo np. `skadprodukt`:
```
cd "W:\OneDrive - Politechnika Śląska\!AI-fableTest-serwisPochodzenieProd"
git remote add origin https://github.com/caspar-11-code/skadprodukt.git
git push -u origin main
```

## 2. Dostęp aplikacji Cloudflare do repo
https://github.com/settings/installations → „Cloudflare Workers and Pages" → Configure → dodaj repo `skadprodukt`.

## 3. Projekt Pages
Dashboard Cloudflare → Workers & Pages → **Create → Pages → Connect to Git** → `skadprodukt`:
- **Build command:** *(puste — `public/` jest commitowane)*
- **Build output directory:** `public`
- Save and Deploy → dostajesz `https://skadprodukt.pages.dev`.

## 4. Custom domain — ZROBIONE (2026-07-02)
`skadprodukt.org` (Active) i `www.skadprodukt.org` (Active) dodane w Pages → Custom domains (rekordy DNS utworzone automatycznie). Uwaga: po dodaniu domeny status „Initializing"/błąd 522 może potrwać do ~1 h (prowizjonowanie).

**www → apex (301), JEDYNY ręczny krok, który został:** Pages `_redirects` NIE wspiera dopasowania po hoście (składnia Netlify), więc www serwuje obecnie stronę wprost (200; canonical wskazuje apex, więc SEO jest bezpieczne). Aby mieć czyste 301: dashboard → strefa `skadprodukt.org` → **Rules → Redirect Rules → Create rule → szablon „Redirect from WWW to Root"** → Deploy. (Podczas konfiguracji 2026-07-02 sekcja Rules w dashboardzie nie chciała się załadować — spróbuj ponownie.)

**404:** w `public/` jest `404.html` (generowany w build.js) — bez niego Pages włącza fallback SPA i każdy nieistniejący adres dostaje 200 ze stroną główną (soft-404, złe dla SEO).

## 5. Backend formularza sugestii (KV)
Formularz `/zglos/` zapisuje zgłoszenia do KV.
1. Workers & Pages → **KV** → Create namespace: `skadprodukt-zgloszenia`.
2. Projekt Pages `skadprodukt` → Settings → **Bindings** (Functions) → Add → **KV namespace**: Variable name `ZGLOSZENIA`, namespace `skadprodukt-zgloszenia`. (Dodaj dla Production i Preview.)
3. Redeploy. Zgłoszenia czytasz w dashboardzie: KV → namespace → klucze `z:...` (JSON). Klucze `rl:...` to licznik antyspamowy (wygasają po dobie).

> Bez bindingu formularz zwraca komunikat „chwilowo niedostępny" (503) — serwis nadal działa, tylko zgłoszenia nie zapisują się.

## 6. SITE_URL w buildzie
Domyślnie `https://skadprodukt.org` (canonical/OG/sitemap/karty). Jeśli zmienisz domenę:
```
set SITE_URL=https://skadprodukt.org && node build.js
```

## 7. Weryfikacja po wdrożeniu (na produkcji)
UWAGA (sieć uczelni / TLS-inspection): curl na tej maszynie wymaga flagi `--ssl-no-revoke`, inaczej zwraca 000 (CRYPT_E_NO_REVOCATION_CHECK).
```
curl -s --ssl-no-revoke https://skadprodukt.org/ | findstr "SkądProdukt"
curl -s --ssl-no-revoke https://skadprodukt.org/skladnik/czosnek/ | findstr "PARADOKS"
curl -s --ssl-no-revoke https://skadprodukt.org/p/rossmann/ | findstr "Hongkong"
curl -sI --ssl-no-revoke https://skadprodukt.org/ | findstr "Content-Security-Policy"
curl -s --ssl-no-revoke -o NUL -w "%{http_code} -> %{redirect_url}" https://www.skadprodukt.org/
```

## 8. SEO / Google
- **Google Search Console** (search.google.com/search-console): dodaj właściwość domenową `skadprodukt.org`, zweryfikuj rekordem TXT DNS w Cloudflare, prześlij `https://skadprodukt.org/sitemap.xml`.
- Sitemap i robots.txt generują się automatycznie; canonical/OG są w każdej stronie.
