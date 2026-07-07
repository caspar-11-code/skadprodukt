# Migracja skadprodukt na serwer (DESKTOP-JVH406L) — runbook

Cel: przenieść cały pipeline (serwis + render + publikacja + scout trendów) na zawsze-włączony
serwer, tak by **działał ciągle, a nie tylko gdy laptop jest włączony**, dotykał mniej limitów
Claude bez spadku jakości, i miał **siatkę bezpieczeństwa** (bo zawsze może się coś wykrzaczyć).

Runbook jest samowystarczalny — możesz go wykonać ręcznie albo oddać agentowi Claude Code na
serwerze („wykonaj deploy/MIGRACJA-SERWER.md").

---

## 1. Diagnoza — co dziś gdzie działa

| Element | Gdzie teraz | Problem |
|---|---|---|
| Repo serwisu (`serwisPochodzenieProd`) | laptop `asusFair`, OneDrive | OK, ale automat zależy od laptopa |
| Silnik (`auto-content-engine`, ~500 MB bez venv) | laptop `C:\`, **poza git, poza OneDrive** | nie ma go na serwerze; zawiera `secrets/` |
| Automat publikacji | **Task Scheduler laptopa** | działa tylko gdy laptop włączony |
| Stan publikacji (`skadprodukt_state.json`) | w silniku, na `C:` | jeden właściciel — nie wolno współdzielić przez sync |

## 2. Zasada nadrzędna — git, NIE OneDrive; jeden właściciel automatu

- **Serwer pracuje na `git clone`, nie na folderze OneDrive.** OneDrive na WSL2 (`/mnt/a`) bywa
  kruche (sync w trakcie renderu, konflikty, wymaga zalogowanego Windows). Git daje wersjonowanie
  i zero wyścigów. OneDrive zostaje tylko jako podgląd z laptopa.
- **Automat ma dokładnie jednego właściciela.** Po przełączeniu automat chodzi TYLKO na serwerze,
  a laptopowy Task Scheduler **wyłączamy**. Inaczej ryzyko: dwie maszyny publikują ten sam film
  albo nadpisują sobie `skadprodukt_state.json`.
- **Sekrety (`secrets/token.json`, `client_secret.json`) nigdy nie idą do gita.** Kopiujesz je raz,
  ręcznie, kanałem prywatnym (ZeroTier `scp`).

## 3. Podział pracy po migracji (hybryda — mniej limitów, bez spadku jakości)

| Warstwa | Co | Koszt Claude |
|---|---|---|
| **Serwer, deterministyczne** (systemd) | render (ffmpeg+Piper), publikacja YT (API), build strony, healthcheck, scraping scouta | **0 tokenów** — nigdy nie potrzebowały Claude |
| **Serwer, lokalny model** (Ollama, RTX 4060 Ti) | wstępny scoring/filtr scouta, hurtowe „czy to temat na short" | **0 tokenów** |
| **Serwer, Claude headless** (`claude -p`, zaplanowane) | finalna weryfikacja faktów (2 źródła), pisanie skryptów PL z fonetyką, adwersaryjna weryfikacja — TYLKO na krótkiej liście po pre-filtrze | mało, rozłożone w czasie |
| **Interaktywnie tutaj** (ta sesja) | duże zmiany, decyzje kreatywne, przeglądy | wg potrzeb |

Klucz do „mniej limitów bez spadku jakości": **model lokalny robi hurt i pre-filtr, Claude dostaje
tylko finał.** Jakość na tym, co publiczne, pilnuje Claude; model lokalny nigdy nie ma ostatniego
słowa. Token to zasób jednego konta Pro — przeniesienie na serwer samo w sobie nie zwiększa puli,
ale: rutyna staje się 0-tokenowa, a zadania Claude idą wsadowo i nie kolidują z pracą na żywo.

## 4. Kroki wdrożenia (na serwerze, WSL2 Ubuntu)

```bash
# 4.0 Strefa czasu (timery systemd liczą OnCalendar w strefie SYSTEMOWEJ!) + poświadczenia GitHub.
sudo timedatectl set-timezone Europe/Warsaw
#   Repo jest publiczne, więc clone zadziała bez logowania — ale PUSH (deploy na CF Pages) wymaga
#   poświadczeń dla usera serwer. Ustaw JEDNO z:
#     gh auth login                       # najprościej, jeśli jest gh
#     git config --global credential.helper store   # + PAT przy pierwszym push
#     (albo deploy key SSH i remote git@github.com:caspar-11-code/skadprodukt.git)

# 4.1 Repo serwisu przez git (źródło prawdy dla automatu)
cd ~ && git clone https://github.com/caspar-11-code/skadprodukt.git
cd ~/skadprodukt

# 4.2 Silnik z laptopa (BEZ .venv/output/__pycache__; ale Z secrets/ i Z voices/ — modele Piper!).
#     Na LAPTOPIE (Git Bash), przez ZeroTier do IP serwera 10.157.239.240:
#   rsync -av --exclude .venv --exclude output --exclude __pycache__ \
#     /c/Users/hkacp/auto-content-engine/ serwer@10.157.239.240:~/auto-content-engine/
#   Sanity po skopiowaniu: MUSZĄ być ~/auto-content-engine/secrets/token.json
#   ORAZ ~/auto-content-engine/voices/pl_PL-mc_speech-medium.onnx (install-server.sh to sprawdzi).

# 4.3 venv silnika (install-server.sh zrobi to sam; ręcznie: )
cd ~/auto-content-engine && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt

# 4.4 (opcjonalnie) Ollama + model na RTX 4060 Ti — pozwala ustawić SCOUT_SCORER=ollama (0 zł)
#   curl -fsSL https://ollama.com/install.sh | sh
#   ollama pull qwen2.5:14b        # 16 GB VRAM spokojnie uciągnie 14B Q4
#   (Dla SCOUT_SCORER=claude potrzebny zalogowany `claude` CLI: sprawdź `claude -p "ping"`.)

# 4.5 Bootstrap usług — uzbraja TYLKO scouta; daily jest instalowane, ale ZAMASKOWANE do cutoveru
cd ~/skadprodukt && bash deploy/install-server.sh

# 4.6 TEST NA SUCHO — zanim cokolwiek pójdzie publicznie
SKADPRODUKT_REPO=~/skadprodukt ~/auto-content-engine/.venv/bin/python \
    ~/auto-content-engine/skadprodukt_daily.py --dry-run
~/auto-content-engine/.venv/bin/python ~/skadprodukt/trend_scout/scout.py --scorer heuristic --limit 6
node ~/skadprodukt/tools/healthcheck.js
```

## 5. Cutover (przełączenie) — dopiero gdy test na sucho przechodzi

1. Potwierdź `git push` z klona serwera (poświadczenia z kroku 4.0) → Cloudflare Pages deploy.
2. Zsynchronizuj stan: skopiuj aktualny `content/skadprodukt_state.json` z laptopa
   (`C:\Users\hkacp\auto-content-engine\content\`) do `~/auto-content-engine/content/` na serwerze —
   inaczej serwer nie wie, co już wyszło (dziś: `wedel`) i mógłby opublikować od nowa.
3. **Wyłącz automat na laptopie** (PowerShell na laptopie):
   `Disable-ScheduledTask -TaskName "SkadProdukt Daily Short"`
4. **Odmaskuj i uzbrój automat na serwerze:**
   `systemctl --user unmask skadprodukt-daily.service`
   `systemctl --user enable --now skadprodukt-daily.timer`
5. Od teraz jedyny właściciel automatu to serwer. Pierwsza publikacja: `roshen` (wg `kolejka.json`),
   z zachowaniem odstępu ≥2 dni (kadencja pilnowana w kodzie, nie w timerze).

## 6. Siatka bezpieczeństwa (bo zawsze może się coś wykrzaczyć)

- **Heartbeat + alerty ntfy** (`deploy/heartbeat.sh`, `ExecStopPost` każdego zadania): każde
  padnięcie (rc≠0) → push na telefon (temat `NTFY_TOPIC` w `/etc/skadprodukt.env`, apka ntfy).
- **Healthcheck po każdej publikacji**: `tools/healthcheck.js` sprawdza stronę, zgodność statystyk
  z bazą, kolejkę, token YT; regresja → alert.
- **Gate publikacji**: automat publikuje tylko rekordy `confidence: "publiczne"`; scout NIC nie
  publikuje ani nie dodaje do bazy — tylko podpowiada do przeglądu.
- **`Persistent=true`** na timerach: jeśli serwer spał o 12:30, zadanie nadrobi po wstaniu.
- **Cotygodniowy podgląd**: `journalctl --user -u skadprodukt-daily` + `content/POMYSLY-DIGEST.md`.

## 7. Rollback

Gdyby serwer zawiódł, wróć do automatu na laptopie w minutę:
1. Serwer: `systemctl --user disable --now skadprodukt-daily.timer`
2. **Skopiuj stan z powrotem**: `~/auto-content-engine/content/skadprodukt_state.json` z serwera →
   `C:\Users\hkacp\auto-content-engine\content\` na laptopie. Stan NIE jest w gicie ani na OneDrive
   (leży w silniku), więc bez tego kroku laptop nie wie o publikacjach zrobionych przez serwer i
   mógłby wydać je ponownie.
3. Laptop: `Enable-ScheduledTask -TaskName "SkadProdukt Daily Short"`.

## 8. Czego NIE ruszać

- Sekretów do gita (są w `.gitignore` silnika — dopilnuj).
- Dwóch automatów naraz (laptop + serwer) — zawsze jeden właściciel.
- Ścieżek na sztywno — wszystko przez `/etc/skadprodukt.env` i `SKADPRODUKT_REPO`.
