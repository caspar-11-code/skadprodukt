# Automatyzacja: dane → serwis → YouTube Shorts / social (0 zł)

## 0. Pętla automatyzacji danych (dodawanie + weryfikacja)

**Dodawanie (półautomat, jedna komenda):**
1. Dopisz nazwy do `data/queue.txt` (albo od razu podaj w rozmowie).
2. W Claude Code: **`/dodaj-marke`** (skill w `.claude/skills/`) — sam robi research w internecie, weryfikuje źródła, tworzy rekord z `==wyróżnieniami==`/`stakes`/`stateAid`, waliduje, buduje i po Twojej zgodzie publikuje.
3. Zgłoszenia czytelników: dashboard Cloudflare → KV `skadprodukt-zgloszenia` (klucze `z:...`) — wklej treść do sesji, reszta jak wyżej.

**Weryfikacja (pełny automat, cotygodniowa):**
- GitHub Actions `weryfikacja-zrodel.yml` — w każdy poniedziałek sprawdza WSZYSTKIE URL-e źródeł w bazie (`tools/check_sources.js`), commituje `SOURCES-REPORT.md`, a przy martwym linku run robi się czerwony i **GitHub sam wysyła maila** — wtedy jedna sesja `/dodaj-marke` z poleceniem „napraw martwe źródła z SOURCES-REPORT.md".
- Walidacja schematu przy każdej publikacji: `tools/publish.ps1` → `tools/validate.js`.
- Rekordy `do-weryfikacji` mają baner ⚠ na stronie i są pomijane w generatorze wideo.


Jedna baza (`data/products.json`) zasila trzy kanały: **serwis www**, **karty graficzne**, **Shorty**.

## 1. Generowanie treści

```
node tools/generate_shorts.js
```

Tworzy dla każdego rekordu z `confidence: "publiczne"`:
- `output/shorts/<slug>.json` — hook, linie narracji, CTA, hashtagi, głos (`piper:pl_PL-mc_speech-medium`) — format pod silnik `make_short_v2.py`,
- `output/shorts/<slug>.txt` — ten sam skrypt czytelny dla człowieka (do ręcznego nagrania/opisu),
- `output/cards/<slug>.svg` — karta 1080×1350 do posta (Instagram/FB/X); PNG pobierzesz też przyciskiem na stronie produktu.

Rekordy `do-weryfikacji` są **celowo pomijane** — nie publikujemy niepotwierdzonych twierdzeń o firmach.

## 1a. Kanał YouTube — DZIAŁA W PEŁNI AUTOMATYCZNIE (2026-07-03)

- Konto: `WolnyStrzelec111@gmail.com` · kanał: **SkądProdukt** · handle: **@skadprodukt** · ID: `UCDYpMzQn0anBjh-n2aP48qQ` · https://www.youtube.com/@skadprodukt
- **Cały pipeline skonfigurowany i zweryfikowany:** Google Cloud projekt `skadprodukt-yt`, YouTube Data API v3 włączone, ekran zgody „SkadProdukt Uploader" opublikowany w **Production** (token bez 7-dniowego wygasania), klient OAuth Desktop, token w `auto-content-engine/secrets/token.json`.
- **Pierwszy film opublikowany:** https://www.youtube.com/watch?v=xVrwlXhRa60 (Wedel).
- **Automat dzienny:** Task Scheduler „SkadProdukt Daily Short" — codziennie 16:00 uruchamia `skadprodukt_daily.py` (render kolejnego z `output/shorts/` + upload; stan w `content/skadprodukt_state.json`, log w `logs/skadprodukt_daily.log`). Ręczne sterowanie: `python skadprodukt_daily.py [--slug X] [--dry-run]`.
- Opis każdego filmu = `disclaimer` z JSON-a (źródła + link do strony marki) — ruch wraca do serwisu. Rekordy „do-weryfikacji" nie mają plików w output/shorts, więc nigdy nie trafią na kanał.

## 2. Montaż wideo — WZORZEC (`make_short_v2.py`, zatwierdzony 2026-07-04)

Silnik: `C:\Users\hkacp\auto-content-engine\make_short_v2.py`. Daily (`skadprodukt_daily.py`) używa `generate_v2`, więc **każdy short automatycznie dostaje pełny wzorzec** — nic nie trzeba ustawiać per film.

**Kanon (nie zmieniać bez powodu):**
- **Głos:** Piper `pl_PL-mc_speech-medium` (natywny PL — NIGDY nie przełącza na angielski), `SynthesisConfig(length_scale=0.95, noise_w_scale=0.62, noise_scale=0.58)` = pewny, stabilny ton.
- **Audio:** mastering (odszum+kompresja+limiter), muzyka proceduralna (0 licencji) głośno (`MUSIC_VOL=0.95`) z delikatnym duckingiem, napisy wyprzedzają mowę o 170 ms.
- **Obraz:** granat+pomarańcz, słowa PISANE WERSALIKAMI → pomarańczowe, pasek postępu, hook-karta, podpis jako sprite skalowany w „pop" (bez przeskoku wersów).

**Fonetyka (automatyczna — to sprawia, że wzorzec skaluje się na wszystkie marki):**
- Liczby (lata, %, liczebniki) → słowa po polsku — automatycznie, nic nie trzeba wpisywać.
- Obce nazwy (Heineken→Hajneken, Goodyear→Gud Jer, SAIC, Geely…) → słownik **`auto-content-engine/custom/pronunciations.json`**. Gdy nowa marka ma obcą nazwę, którą lektor przekręca: **dopisz jedną linię do tego pliku** (klucz = oryginał, wartość = zapis fonetyczny PL) i gotowe dla wszystkich shortów.
- Napisy zawsze pokazują ORYGINAŁ; fonetyka dotyczy tylko tego, co czyta lektor.
- Hero-short (ręcznie dopieszczony) może mieć w JSON pole `speak` = pełny tekst fonetyczny (wtedy pomija słownik/liczby) — musi mieć tę samą liczbę zdań co napisy. Przykład: `custom/top5-niby-polskie.json`.

Ręczne sterowanie: `python make_short_v2.py custom/plik.json` (render) lub `python skadprodukt_daily.py --slug <marka> --dry-run`.

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
