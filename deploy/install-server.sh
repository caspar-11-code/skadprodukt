#!/usr/bin/env bash
# install-server.sh — jednorazowy bootstrap usług skadprodukt na serwerze (WSL2 Ubuntu).
# Zakłada, że repo jest już sklonowane (git) i że silnik (auto-content-engine) jest
# skopiowany z laptopa wraz z secrets/ ORAZ voices/ (modele Piper). Patrz MIGRACJA-SERWER.md.
#
# WAŻNE: NIE uzbraja automatu publikacji (daily). Daily pozostaje ZAMASKOWANE do cutoveru,
# żeby nic nie poszło publicznie przed testem na sucho i wyłączeniem automatu na laptopie.
#
# Uruchom Z KATALOGU REPO:  bash deploy/install-server.sh
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
ENGINE="${SKADPRODUKT_ENGINE:-$HOME/auto-content-engine}"
NODE_BIN="$(command -v node || true)"
echo "== Repo:   $REPO"
echo "== Silnik: $ENGINE"
echo "== node:   ${NODE_BIN:-BRAK}"

# 1) sanity — najczęstsze footguny migracji
[ -f "$ENGINE/skadprodukt_daily.py" ] || { echo "BŁĄD: brak silnika w $ENGINE — skopiuj go z laptopa."; exit 1; }
[ -f "$ENGINE/secrets/token.json" ] || { echo "BŁĄD: brak $ENGINE/secrets/token.json — skopiuj sekrety YT z laptopa (NIE do gita!)."; exit 1; }
[ -f "$ENGINE/voices/pl_PL-mc_speech-medium.onnx" ] || { echo "BŁĄD: brak modelu Piper $ENGINE/voices/pl_PL-mc_speech-medium.onnx — skopiuj katalog voices/ z laptopa."; exit 1; }
[ -n "$NODE_BIN" ] || { echo "BŁĄD: brak node w PATH"; exit 1; }
command -v python3 >/dev/null || { echo "BŁĄD: brak python3"; exit 1; }

# 2) venv silnika + zależności (pip twardo — awaria = stop)
if [ ! -d "$ENGINE/.venv" ]; then
  echo "== Buduję venv silnika…"
  python3 -m venv "$ENGINE/.venv"
fi
"$ENGINE/.venv/bin/pip" install -q --upgrade pip
if [ -f "$ENGINE/requirements.txt" ]; then
  "$ENGINE/.venv/bin/pip" install -q -r "$ENGINE/requirements.txt"
else
  echo "BŁĄD: brak $ENGINE/requirements.txt (potrzebne: piper-tts, imageio-ffmpeg, edge-tts, google-api-python-client, google-auth-oauthlib, truststore, pillow, numpy)"; exit 1
fi

# 3) plik środowiska — podmień ścieżki na realne (repo, silnik, node)
if [ ! -f /etc/skadprodukt.env ]; then
  echo "== Instaluję /etc/skadprodukt.env"
  sudo cp "$REPO/deploy/skadprodukt.env" /etc/skadprodukt.env
  sudo sed -i \
     -e "s#^SKADPRODUKT_REPO=.*#SKADPRODUKT_REPO=$REPO#" \
     -e "s#^SKADPRODUKT_ENGINE=.*#SKADPRODUKT_ENGINE=$ENGINE#" \
     -e "s#^SKADPRODUKT_PY=.*#SKADPRODUKT_PY=$ENGINE/.venv/bin/python#" \
     -e "s#^SKADPRODUKT_NODE=.*#SKADPRODUKT_NODE=$NODE_BIN#" \
     /etc/skadprodukt.env
  echo "   ⚠  Otwórz /etc/skadprodukt.env i zmień NTFY_TOPIC na własny (alerty na telefon)."
fi
chmod +x "$REPO/deploy/heartbeat.sh"

# 4) jednostki systemd użytkownika. Uzbrajamy TYLKO scouta (nic nie publikuje).
#    daily instalujemy i MASKUJEMY — aktywujesz je świadomie dopiero przy cutoverze.
mkdir -p "$HOME/.config/systemd/user"
cp "$REPO"/deploy/systemd/*.service "$REPO"/deploy/systemd/*.timer "$HOME/.config/systemd/user/"
systemctl --user daemon-reload
systemctl --user enable --now skadprodukt-scout.timer
systemctl --user mask skadprodukt-daily.service   # bezpiecznik: nawet ręczny start nic nie opublikuje
# pozwól usługom działać bez aktywnej sesji (kluczowe dla „cały czas, nie tylko gdy zalogowany")
sudo loginctl enable-linger "$USER" || echo "   (uruchom ręcznie: sudo loginctl enable-linger $USER)"

echo "== Gotowe (daily ZAMASKOWANE do cutoveru). Timery:"
systemctl --user list-timers 'skadprodukt-*' --no-pager || true
cat <<EOF

NASTĘPNE KROKI:
  1) TEST NA SUCHO (bez publikacji):
       SKADPRODUKT_REPO=$REPO "$ENGINE/.venv/bin/python" $ENGINE/skadprodukt_daily.py --dry-run
       "$ENGINE/.venv/bin/python" $REPO/trend_scout/scout.py --scorer heuristic --limit 6
       "$NODE_BIN" $REPO/tools/healthcheck.js
  2) CUTOVER (dopiero gdy powyższe działa):
       - skopiuj aktualny content/skadprodukt_state.json z laptopa do $ENGINE/content/
       - na LAPTOPIE:  Disable-ScheduledTask -TaskName "SkadProdukt Daily Short"
       - na SERWERZE:  systemctl --user unmask skadprodukt-daily.service
                       systemctl --user enable --now skadprodukt-daily.timer
EOF
