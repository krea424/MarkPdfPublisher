#!/usr/bin/env bash
set -euo pipefail

BASE="/Users/moromoro/Desktop/MarkPdfPublisher"
TX_DIR="$BASE/docs/CODEX_TRANSCRIPTS"
DAY="$(TZ=Europe/Rome date +%F)"
SUM="$BASE/docs/CODEX_SESSION_LOG_${DAY}.md"

echo "== Close Session =="
echo "1) Assicurati di aver scritto 'STOPLOG' a Codex (IDE) prima di eseguire questo script."

# 2) Backup del transcript più recente (se esiste)
LATEST_TX_BEFORE_BACKUP="$(ls -t "$TX_DIR"/*.md 2>/dev/null | head -n 1 || true)"
if [[ -n "${LATEST_TX_BEFORE_BACKUP:-}" && -f "$LATEST_TX_BEFORE_BACKUP" ]]; then
  TS_BACKUP="$(TZ=Europe/Rome date +%Y%m%dT%H%M%S)"
  BKP_PATH="${LATEST_TX_BEFORE_BACKUP%.md}.backup.${TS_BACKUP}.md"
  cp "$LATEST_TX_BEFORE_BACKUP" "$BKP_PATH"
  echo "2) Backup creato: $BKP_PATH"
else
  echo "2) Nessun transcript da salvare in backup."
fi

echo "3) Eseguo sanitizer del transcript più recente…"
python3 "$BASE/scripts/sanitize_transcript.py" || { echo "Sanitizer fallito."; exit 1; }

echo
echo "== Riepilogo di oggi (${DAY}) =="
if [[ -f "$SUM" ]]; then
  echo "-- Ultime 3 righe summary:"
  tail -n 3 "$SUM"
else
  echo "Nessun summary per oggi: $SUM"
fi

LATEST_TX="$(ls -t "$TX_DIR"/*.md 2>/dev/null | head -n 1 || true)"
if [[ -n "${LATEST_TX:-}" && -f "$LATEST_TX" ]]; then
  echo
  echo "-- Ultime 20 righe transcript: $LATEST_TX"
  tail -n 20 "$LATEST_TX"
else
  echo "Nessun transcript trovato in $TX_DIR"
fi

echo
echo "Fatto. Puoi chiudere Cursor in sicurezza."
