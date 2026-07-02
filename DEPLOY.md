# Wdrożenie SkądTo? na Cloudflare Pages (0 zł)

Ten sam pipeline co gamestheory.org: GitHub → Cloudflare Pages auto-deploy po pushu na `main`.

## Kroki (jednorazowo, ~10 min)

### 1. Repo na GitHub
Konto `caspar-11-code`, nowe **prywatne lub publiczne** repo, np. `skad-to-pochodzi`:
- wejdź na https://github.com/new → nazwa `skad-to-pochodzi` → Create.
- lokalnie (git już jest zainicjowany i zacommitowany):
  ```
  cd "W:\OneDrive - Politechnika Śląska\!AI-fableTest-serwisPochodzenieProd"
  git remote add origin https://github.com/caspar-11-code/skad-to-pochodzi.git
  git push -u origin main
  ```

### 2. Dostęp aplikacji Cloudflare do repo
https://github.com/settings/installations → „Cloudflare Workers and Pages" → Configure → dodaj repo `skad-to-pochodzi` (tak samo jak przy candle/hub).

### 3. Projekt Pages
Dashboard Cloudflare (konto hkacper111@gmail.com) → Workers & Pages → **Create → Pages → Connect to Git** → wybierz `skad-to-pochodzi`:
- **Build command:** *(puste — public/ jest commitowane)*
- **Build output directory:** `public`
- Save and Deploy.

Dostajesz darmowy adres `https://<nazwa-projektu>.pages.dev` (np. `skadto.pages.dev` — jeśli wolny, nazwij projekt `skadto`).

### 4. (Opcjonalnie) własny URL pod gamestheory.org
Jeśli nie chcesz kupować domeny: Pages → Custom domains → `skadto.gamestheory.org` (subdomena istniejącej strefy Cloudflare — 0 zł). Branding jest neutralny, więc docelowo lepsza osobna domena (np. skadto.pl, ~50 zł/rok — ale to już płatne, więc decyzja Twoja).

### 5. Ustaw docelowy adres w buildzie
Po ustaleniu finalnego URL przebuduj z poprawnym adresem (wpływa na canonical/sitemap/karty):
```
set SITE_URL=https://skadto.pages.dev && node build.js
```
(albo na stałe zmień domyślną wartość `SITE_URL` na górze `build.js`), potem `tools\publish.ps1`.

## Alternatywa bez GitHuba (szybki test)
```
npx wrangler pages deploy public --project-name=skadto
```
(wymaga zalogowania `npx wrangler login`).

## Weryfikacja po wdrożeniu (jak zwykle — na produkcji)
```
curl -s https://skadto.pages.dev/ | findstr "SkądTo"
curl -s https://skadto.pages.dev/p/wedel/ | findstr "LOTTE"
curl -s https://skadto.pages.dev/sitemap.xml | findstr "statystyki"
```
