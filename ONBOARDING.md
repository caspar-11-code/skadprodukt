# SkądProdukt — instrukcja operatora (onboarding)

Dokument dla osoby przejmującej bieżącą obsługę projektu (Damian). Stan: 2026-07-06.

## Czym to jest

Trzy połączone elementy:

1. **Serwis https://skadprodukt.org** — statyczny portal edukacyjny: prawdziwe pochodzenie marek (kto produkuje, kto jest właścicielem, skąd kapitał). Repo = ten katalog; hosting Cloudflare Pages (deploy automatyczny po `git push`, ~1 min).
2. **Kanał YouTube @skadprodukt** — Shorts generowane silnikiem wideo. Konto: WolnyStrzelec111@gmail.com.
3. **Silnik wideo** — `C:\Users\hkacp\auto-content-engine` (Python + ffmpeg + Piper TTS). Automat publikuje 1 short **co 2 dni o 12:30** (Harmonogram zadań Windows: „SkadProdukt Daily Short").

Wsparcie: https://buycoffee.to/skadprodukt (konto: WolnyStrzelec111@gmail.com).

## Zasady nienegocjowalne

- **Zero płatnych usług.** Cloudflare free, darmowe API, lokalny TTS.
- **Każdy fakt ma źródło z URL.** Min. 2 działające źródła na markę. Nie publikujemy plotek ani „wiadomo, że".
- **Ton neutralny.** Fakty, nie oceny. Rekordy `confidence: "do-weryfikacji"` NIE trafiają do Shorts i nie powinny być eksponowane.
- **Licencja PolyForm Noncommercial 1.0.0**; treści prawne (cookies/RODO) — nie ruszać bez konsultacji (są zgodne z art. 399 PKE, wyjątek ust. 3 pkt 2 — brak banera zgód jest CELOWY).
- **Wzorzec wideo jest kanoniczny** (głos `piper:pl_PL-mc_speech-medium`, parametry mastering/animacji w `make_short_v2.py`) — zatwierdzony przez Kacpra; zmiany tylko po jego akceptacji.
- Dane osobowe administratora są ukryte w zwijanym bloku na /prywatnosc/ — nie eksponować nigdzie indziej.

## Rutyna (co i kiedy)

**Automat robi sam:** co 2 dni o 12:30 bierze pierwszy niepublikowany slug z `C:\Users\hkacp\auto-content-engine\content\kolejka.json`, renderuje MP4 i publikuje PUBLICZNIE na YT. Stan w `content\skadprodukt_state.json`.

**Ty (raz na 2-3 dni, 2 minuty):**
```
node tools/healthcheck.js
```
Jedna komenda sprawdza wszystko: stronę, statystyki, skrypty, kolejkę, harmonogram, log, token YT. `[BŁĄD]` = działaj; `[UWAGA]` = ogarnij przy okazji.

## Jak dodać markę do bazy

1. Research: właściciel marki, kraj kapitału, kraj produkcji/zakłady, min. 2 źródła (strony spółek, KRS, raporty, renomowane media). Kandydaci czekają w `data/queue.txt`.
2. Dopisz rekord do `data/products.json` (wzoruj się na istniejących; pola: slug, brand, category, producer, productionCountry, plants[], brandOwner, ownerCountry, capitalCountry, capitalNote z `==podświetleniem==`, story, opcjonalnie funFact + stakes[], sources[], confidence, updated). Uwaga na cudzysłowy typograficzne w polskich tekstach — JSON wymaga prostych `"` jako ograniczników.
3. Kolejno:
```
node tools/validate.js        # walidacja schematu
node tools/check_sources.js   # czy źródła żyją (HTTP)
node build.js                 # przebudowa public/
node tools/generate_shorts.js # skrypty Shorts + karty SVG
git add -A && git commit -m "feat: marka X" && git push
```
4. Po ~1 min sprawdź na produkcji: `https://skadprodukt.org/p/<slug>/`.
5. (opcjonalnie) dopisz slug w wybrane miejsce `kolejka.json` — inaczej pójdzie na końcu, alfabetycznie.

## Jak zrobić short „hero" (kompilacja, np. top 5)

Automat robi zwykłe shorty sam. Hero (lepiej dopracowane, tematyczne) robisz ręcznie:

1. Skopiuj wzór: `C:\Users\hkacp\auto-content-engine\custom\top5-niby-polskie.json` albo `spozywcze-niby-polskie.json`.
2. Kluczowe pole **`speak`** — ten sam tekst co `lines`+`cta`, ale FONETYCZNIE (Heinz→„Hajnc", Geely→„Dżili", liczby słownie: „od tysiąc dziewięćset..."). **Liczba zdań w `speak` musi być równa liczbie zdań w `lines`+`cta`** — inaczej render odmówi. Wymowa pojedynczych słów dla zwykłych shortów: `custom\pronunciations.json` (jedna linia na markę).
3. Render i upload (PowerShell, z katalogu silnika):
```
cd C:\Users\hkacp\auto-content-engine
.venv\Scripts\python.exe make_short_v2.py custom\moj-short.json
```
4. Upload jako **private**, link do recenzji dla Kacpra — publikuje on (albo Ty po jego OK). Wzór uploadu masz w historii: `youtube_upload.upload(mp4, title, desc, tags, privacy="private")`.

## Strategia treści (research 2026-07)

Pełny ranking w `POPULARNOSC-SEKTOROW.md`. Skrót: **jedzenie/FMCG to filar** (największy szok-faktor i zasięgi), potem sieci handlowe i drogerie; moto jako przerywnik (~1 na 4-5 shortów). Kolejka w `kolejka.json` już to odzwierciedla (3 spożywcze : 1 moto).

## Awarie — szybka diagnostyka

| Objaw | Co zrobić |
|---|---|
| Upload padł / brak tokenu | `cd C:\Users\hkacp\auto-content-engine && .venv\Scripts\python.exe youtube_upload.py auth` (przeglądarka → konto WolnyStrzelec111; token ma scope upload+force-ssl, backup w secrets/token.backup.json) |
| Trzeba hurtowo poprawić opisy/tagi istniejących filmów | edytuj listę VIDEOS i teksty w `update_yt_all.py`, potem `.venv\Scripts\python.exe update_yt_all.py` |
| `curl` błąd CRYPT_E_NO_REVOCATION_CHECK | dodaj flagę `--ssl-no-revoke` (specyfika Windows/schannel) |
| Statystyki „nieaktualne" na stronie | to cache karty przeglądarki — Ctrl+F5; serwer ma `max-age=0` |
| Głos przekręca nazwę | dopisz wymowę do `custom\pronunciations.json`, wyrenderuj ponownie |
| Automat nic nie opublikował | `node tools/healthcheck.js`, potem log `C:\Users\hkacp\auto-content-engine\logs\skadprodukt_daily.log` |
| PowerShell nie zna `&&` | to PS 5.1 — rozdziel `;` albo użyj Git Bash |

## Co wymaga zgody Kacpra

Zmiana wzorca wideo (głos/parametry), publikacja shortów hero, zmiany treści prawnych, wydatki (nie ma żadnych i ma tak zostać), integracje z nowymi platformami, wszystko co dotyczy danych osobowych.
