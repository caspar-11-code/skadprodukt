---
name: dodaj-marke
description: Dodaje nowe marki/składniki do bazy skadprodukt.org - research w internecie, weryfikacja źródeł, rekord JSON, walidacja, build i publikacja. Użyj gdy user chce dodać markę/produkt/składnik do serwisu, albo mówi "przerób kolejkę" (data/queue.txt).
---

# Dodawanie marki/składnika do skadprodukt.org

Katalog projektu: `W:\OneDrive - Politechnika Śląska\!AI-fableTest-serwisPochodzenieProd`

## Wejście
- Argument użytkownika (nazwy marek/składników), LUB
- `data/queue.txt` — jedna nazwa na linię (linie zaczynające się od `#` pomijaj; po przetworzeniu usuń linię z kolejki),
- opcjonalnie zgłoszenia użytkowników z KV `skadprodukt-zgloszenia` (jeśli user je wklei).

## Procedura (dla KAŻDEJ marki osobno)
1. **Research (WebSearch)**: właściciel marki, kraj kapitału (przejęcia! stan na dziś), producent, zakłady w PL, powiązania kapitałowe (udziały %), udokumentowane wsparcie państwa.
2. **Zasady żelazne** (patrz README „Zasady redakcyjne"):
   - min. 2 źródła z URL; fakty przypisuj źródłom; ton neutralny, zero wezwań do bojkotu;
   - czego nie potwierdzisz → `confidence: "do-weryfikacji"` albo pomiń;
   - wsparcie państwa TYLKO z twardym źródłem (rozporządzenia KE, dokumenty urzędowe) → pole `stateAid`.
3. **Rekord** do `data/products.json` (schemat w `$schemaInfo`; składniki → `data/ingredients.json`):
   - kluczowe zdanie w `capitalNote` oznacz `==...==` (czerwone wyróżnienie),
   - udziały → `stakes[]`, wsparcie państwa → `stateAid{text, sources[], sourceDate}`,
   - `story` = 1 zdanie pod social media (bez `==`), `updated` = dzisiejsza data.
4. **Walidacja + build**: `node tools/validate.js && node build.js && node tools/generate_shorts.js`.
5. **Weryfikacja lokalna**: podnieś preview (launch.json „skadto"), sprawdź stronę nowej marki.
6. **Publikacja** (po zgodzie usera): `powershell -ExecutionPolicy Bypass -File tools\publish.ps1 -Message "dodano: <marki>"`. Uwaga: push wymaga `git config http.sslBackend schannel` (już ustawione w repo).
7. **Weryfikacja produkcji**: `curl -s --ssl-no-revoke https://skadprodukt.org/p/<slug>/ | findstr <właściciel>`.

## Pułapki
- curl na tej maszynie: zawsze `--ssl-no-revoke`; lokalny openssl pokazuje certy AVG (MITM).
- Wikipedia z polskimi znakami w URL → percent-encoding.
- Nazwy krajów: ISO-2 wielkimi literami; specjalne: `EU` (rozproszona produkcja), `XX` (różne kraje, 🌐), lista w `COUNTRIES` w build.js — brakujący kraj dopisz tam i w `tools/generate_shorts.js`.
