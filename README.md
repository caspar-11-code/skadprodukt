# 🧭 SkądProdukt.org — portal świadomego konsumenta

Serwis pokazujący, **skąd naprawdę pochodzi produkt**: kraj produkcji, producent, właściciel marki, pochodzenie kapitału (w tym powiązania kapitałowe/udziały) oraz **pochodzenie składników** na mapie świata. Publiczne, udokumentowane dane zebrane w jednym miejscu — „IMDb dla pochodzenia produktów".

Domena: **skadprodukt.org** (Cloudflare). Zero płatnych usług poza domeną: statyczny serwis (Cloudflare Pages free tier), backend formularza na Pages Functions + KV (free tier), zero zależności npm.

## Architektura

```
data/products.json        ← marki: producent, właściciel, kapitał, stakes[], powiązania ze składnikami
data/ingredients.json     ← składniki: kraje pochodzenia (mapa), statystyki, "issues", źródła
build.js                  ← generator statyczny (node build.js → public/)
assets-src/               ← źródła: style.css, app.js, world-map.svg (amCharts), og.png
functions/api/zgloszenie.js ← backend formularza sugestii (Pages Function + KV, honeypot, rate-limit)
tools/validate.js         ← walidacja schematu marek i składników
tools/generate_shorts.js  ← skrypty YT Shorts (JSON+TXT) + karty social (SVG 1080×1350)
tools/publish.ps1         ← walidacja → build → treści → commit → push (= auto-deploy)
public/                   ← wygenerowany serwis (commitowany, deploy bez build stepu)
```

## Funkcje

- **Marki i kapitał** (`/marki/`) — wyszukiwarka + filtry po kraju kapitału i kategorii; strona marki z łańcuchem marka→producent→właściciel→kapitał, tabelą faktów, **powiązaniami kapitałowymi** (np. Mercedes: BAIC 9,98% + Geely 9,7%), źródłami i kartą social do pobrania (PNG).
- **Składniki i mapa** (`/skladniki/`) — dla każdego surowca interaktywna **mapa świata** z krajami pochodzenia, liczby i fakty ze źródłami oraz „czego nie widać na etykiecie" (praca dzieci, nielegalne uprawy, fałszowanie, reklasyfikacja zboża technicznego itd.).
- **Statystyki** — teza serwisu: „produkcja w PL ≠ polski kapitał".
- **Formularz sugestii** (`/zglos/`) — bez podawania danych, honeypot + limit zgłoszeń; trafia do prywatnego KV.
- PL/EN (auto-detekcja + przełącznik), OG/Twitter card, sitemap, robots, twarde nagłówki bezpieczeństwa (CSP/HSTS/X-Frame-Options — standard jak w candle/hub).

## Codzienna praca (cały pipeline = 1 komenda)

1. Dopisz/popraw rekord w `data/products.json` lub `data/ingredients.json` (schemat opisany w polu `$schemaInfo`).
2. `powershell -ExecutionPolicy Bypass -File tools\publish.ps1 -Message "opis zmiany"`
3. Cloudflare Pages wdraża automatycznie po pushu (~1 min).

## Zasady redakcyjne (ważne prawnie)

- Tylko fakty z publicznych źródeł; **każdy rekord, statystyka i „issue" ma źródło z linkiem i datą**.
- `confidence: "do-weryfikacji"` = widoczny baner ⚠ na stronie, a generator Shorts **pomija** taki rekord.
- Ton neutralny: pokazujemy strukturę własności i pochodzenie surowców, nie oceniamy i nie wzywamy do bojkotu. Twierdzenia przypisujemy źródłom, nie formułujemy oskarżeń.
- Zgłoszenia poprawek (także od firm) — formularz `/zglos/`, weryfikacja przed publikacją.

## Deploy i automatyzacja

Patrz [DEPLOY.md](DEPLOY.md) (Cloudflare Pages + domena + KV formularza) oraz [AUTOMATYZACJA.md](AUTOMATYZACJA.md) (treści wideo/social).

## Licencja

PolyForm Noncommercial 1.0.0 — Required Notice: Copyright Kacper (2026). Mapa świata: amCharts (darmowa licencja z atrybucją). Dane faktograficzne pochodzą ze źródeł publicznych.
