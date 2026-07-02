# 🧭 SkądTo? — sprawdź, skąd naprawdę pochodzi produkt

Serwis pokazujący dla marek z polskich sklepów: **kraj produkcji · producenta · właściciela marki · pochodzenie kapitału**. Publiczne dane (etykiety, KRS, raporty, prasa) zebrane w jednym miejscu — „IMDb dla pochodzenia produktów".

Zero płatnych usług: statyczny serwis (Cloudflare Pages free tier), zero zależności npm, dane w jednym pliku JSON.

## Architektura

```
data/products.json        ← JEDYNE źródło prawdy (1 rekord = 1 marka)
build.js                  ← generator statyczny (node build.js → public/)
tools/validate.js         ← walidacja schematu danych
tools/generate_shorts.js  ← skrypty YT Shorts (JSON+TXT) + karty social (SVG 1080×1350)
tools/publish.ps1         ← walidacja → build → treści → commit → push (= auto-deploy)
public/                   ← wygenerowany serwis (commitowany, deploy bez build stepu)
output/shorts|cards/      ← treści do publikacji wideo/social (poza gitem serwisu)
```

## Codzienna praca (cały pipeline = 1 komenda)

1. Dopisz/popraw rekord w `data/products.json` (schemat opisany w polu `$schemaInfo`; nowy rekord możesz wygenerować promptem — patrz `AUTOMATYZACJA.md`).
2. `powershell -ExecutionPolicy Bypass -File tools\publish.ps1 -Message "dodano markę X"`
3. Cloudflare Pages wdraża automatycznie po pushu (~1 min).

## Funkcje serwisu

- wyszukiwarka + filtry po kraju kapitału i kategorii (client-side, bez backendu),
- strona każdego produktu: łańcuch marka→producent→właściciel→kapitał, tabela faktów, źródła, data „stan na",
- karta social SVG z pobieraniem PNG (canvas, bez serwera),
- strony per kraj (`/kraj/pl/` itd.), statystyki z tezą serwisu („produkcja w PL ≠ polski kapitał"),
- metodologia + formularz zgłoszeń poprawek (mailto),
- PL/EN (auto-detekcja `navigator.language`, przełącznik, localStorage),
- SEO: statyczny HTML, canonical, OG, sitemap.xml, robots.txt.

## Zasady redakcyjne (ważne prawnie)

- Tylko fakty z publicznych źródeł; **każdy rekord ma źródła i datę**.
- `confidence: "do-weryfikacji"` = widoczny baner ⚠ na stronie, a generator Shorts **pomija** taki rekord.
- Neutralny ton: pokazujemy strukturę własności, nie oceniamy i nie wzywamy do bojkotu.
- Zgłoszenia poprawek (także od firm) — mail w stopce, weryfikacja przed publikacją.

## Deploy

Patrz [DEPLOY.md](DEPLOY.md). Automatyzacja treści wideo — [AUTOMATYZACJA.md](AUTOMATYZACJA.md).

## Licencja

PolyForm Noncommercial 1.0.0 — Required Notice: Copyright Kacper (2026).
