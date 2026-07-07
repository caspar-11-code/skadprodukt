#!/usr/bin/env bash
# heartbeat.sh — uruchamiany PO każdym zadaniu (ExecStopPost) oraz raz dziennie.
# Zapisuje status ostatniego przebiegu i alarmuje na ntfy przy awarii/regresji.
# Użycie: heartbeat.sh <nazwa-zadania> <kod-wyjścia>
set -uo pipefail
source /etc/skadprodukt.env 2>/dev/null || true

JOB="${1:-unknown}"
RC="${2:-0}"
# ExecStopPost przekazuje $EXIT_STATUS: liczbę przy normalnym wyjściu, ale NAZWĘ SYGNAŁU
# (np. TERM/KILL przy timeoucie) gdy usługę ubito. Nienumeryczne traktujemy jako awarię.
case "$RC" in ''|*[!0-9]*) RC=1 ;; esac

STATE_DIR="${SKADPRODUKT_ENGINE:-/home/serwer/auto-content-engine}/logs"
mkdir -p "$STATE_DIR"
STAMP="$(date -Iseconds)"
echo "{\"job\":\"$JOB\",\"rc\":$RC,\"at\":\"$STAMP\"}" > "$STATE_DIR/heartbeat-$JOB.json"

notify() {  # ntfy.sh jest darmowe i nie wymaga konta; temat publiczny — bez wrażliwych treści
  [ -n "${NTFY_TOPIC:-}" ] || return 0
  curl -s -m 15 -H "Title: $1" -H "Priority: ${3:-default}" \
       -d "$2" "https://ntfy.sh/${NTFY_TOPIC}" >/dev/null || true
}

if [ "$RC" -ne 0 ]; then
  notify "skadprodukt: $JOB padlo (rc=$RC)" \
         "Zadanie $JOB zakonczone bledem o $STAMP. Sprawdz na serwerze: journalctl --user -u skadprodukt-$JOB" high
  exit 0
fi

# po udanym zadaniu — lekki healthcheck spójności (bez publikacji)
if [ "$JOB" = "daily" ] || [ "$JOB" = "health" ]; then
  cd "${SKADPRODUKT_REPO:-/home/serwer/skadprodukt}" || exit 0
  if ! "${SKADPRODUKT_NODE:-node}" tools/healthcheck.js > "$STATE_DIR/health-last.txt" 2>&1; then
    # tylko lakoniczny sygnał na publiczny ntfy; szczegóły zostają lokalnie w logs/health-last.txt
    notify "skadprodukt: healthcheck zglasza BLEDY" \
           "Regresja healthchecku po zadaniu $JOB. Szczegoly na serwerze: logs/health-last.txt" high
  fi
fi
