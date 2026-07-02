# Automatyzacja treści: serwis → YouTube Shorts / social (0 zł)

Jedna baza (`data/products.json`) zasila trzy kanały: **serwis www**, **karty graficzne**, **Shorty**.

## 1. Generowanie treści

```
node tools/generate_shorts.js
```

Tworzy dla każdego rekordu z `confidence: "publiczne"`:
- `output/shorts/<slug>.json` — hook, linie narracji, CTA, hashtagi, głos (`pl-PL-MarekNeural`) — format pod istniejący silnik wideo,
- `output/shorts/<slug>.txt` — ten sam skrypt czytelny dla człowieka (do ręcznego nagrania/opisu),
- `output/cards/<slug>.svg` — karta 1080×1350 do posta (Instagram/FB/X); PNG pobierzesz też przyciskiem na stronie produktu.

Rekordy `do-weryfikacji` są **celowo pomijane** — nie publikujemy niepotwierdzonych twierdzeń o firmach.

## 2. Montaż wideo — istniejący silnik `auto-content-engine`

Masz już działający pipeline w `C:\Users\hkacp\auto-content-engine` (edge-tts + ffmpeg, zweryfikowany 2026-06-30). Adaptacja pod SkądTo:

1. Skopiuj `output/shorts/*.json` do katalogu roboczego silnika.
2. W `make_short.py` podmień źródło skryptu na pola `hook` + `lines` + `cta` (struktura celowo taka sama) i głos na `pl-PL-MarekNeural`.
3. Tło Shorta: wyrenderowana karta `output/cards/<slug>.svg` (ffmpeg przyjmie PNG — konwersja: otwórz SVG w przeglądarce albo `magick` jeśli jest; na stronie produktu jest też przycisk „Pobierz PNG").
4. Auto-post: gotowy `youtube_upload.py` + `run_daily.py` (YouTube Data API v3) — wymaga tylko Twojego OAuth (kroki w `SETUP.md` silnika).

Pamiętaj o gotchy sieci uczelni: `truststore.inject_into_ssl()` i napisy synchronizowane per zdanie (edge-tts za TLS-inspection gubi WordBoundary).

## 3. Rytm publikacji (propozycja)

- **Serwis:** nowe rekordy w dowolnym momencie — `tools\publish.ps1` robi walidację → build → push → auto-deploy.
- **Shorty:** 1 dziennie z kolejki `output/shorts/` (Task Scheduler + `run_daily.py` — wzorzec już masz w `scripts/register_task.ps1` silnika).
- **Opis każdego filmu:** wygenerowany `disclaimer` (źródła + link do strony produktu) — to buduje ruch do serwisu i zabezpiecza prawnie.

## 4. Dodawanie nowych produktów (z pomocą Claude)

Najszybszy sposób: podaj mi markę (albo zdjęcie etykiety), a ja researchuję właściciela/kapitał w publicznych źródłach i dopiszę rekord do `data/products.json` z linkami. Walidator (`tools/validate.js`) pilnuje schematu, a flaga `do-weryfikacji` wstrzymuje publikację wideo do potwierdzenia.

## 5. Granice (te same co w auto-content-engine)

- Nie zakładam kont i nie robię OAuth za Ciebie; posting wyłącznie oficjalnym API.
- Publikujemy tylko fakty ze źródłami; ton neutralny, bez wezwań do bojkotu.
- Zgłoszenia od firm: mail w stopce serwisu, korekta lub udokumentowana odmowa.
