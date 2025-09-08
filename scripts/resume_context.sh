#!/usr/bin/env bash
set -euo pipefail

# Read-only resume helper (Europe/Rome)
# - Chooses transcript: prefer yesterday, else latest by mtime
# - Chooses summary: prefer today, else yesterday, else newest by mtime
# - Prints small, copy-ready snapshot (no writes)

BASE="/Users/moromoro/Desktop/MarkPdfPublisher"
DOCS_DIR="$BASE/docs"
TX_DIR="$DOCS_DIR/CODEX_TRANSCRIPTS"

DAY=$(TZ=Europe/Rome date +%F)
YDAY=$(python3 - <<'PY'
from datetime import datetime, timedelta
try:
    from zoneinfo import ZoneInfo
    tz = ZoneInfo('Europe/Rome')
except Exception:
    tz = None
now = datetime.now(tz) if tz else datetime.now()
print((now - timedelta(days=1)).date().isoformat())
PY
)

# Resolve transcript
TRANSCRIPT="$TX_DIR/${YDAY}.md"
if [[ ! -f "$TRANSCRIPT" ]]; then
  TRANSCRIPT=$(ls -t "$TX_DIR"/*.md 2>/dev/null | head -n 1 || true)
fi

# Resolve summary
SUMMARY="$DOCS_DIR/CODEX_SESSION_LOG_${DAY}.md"
if [[ ! -f "$SUMMARY" ]]; then
  ALT="$DOCS_DIR/CODEX_SESSION_LOG_${YDAY}.md"
  if [[ -f "$ALT" ]]; then SUMMARY="$ALT"; else SUMMARY=$(ls -t "$DOCS_DIR"/CODEX_SESSION_LOG_*.md 2>/dev/null | head -n 1 || true); fi
fi

echo "== Resume Context (read-only) =="
echo "Europe/Rome DAY=${DAY} YDAY=${YDAY}"

if [[ -n "${TRANSCRIPT:-}" && -f "$TRANSCRIPT" ]]; then
  echo
  echo "--- Transcript file ---"
  echo "$TRANSCRIPT"
  echo "--- Transcript head (first 250 lines) ---"
  sed -n '1,250p' "$TRANSCRIPT"
  echo
  echo "--- Transcript tail (last 120 lines) ---"
  tail -n 120 "$TRANSCRIPT"
else
  echo
  echo "No transcript found in $TX_DIR"
fi

if [[ -n "${SUMMARY:-}" && -f "$SUMMARY" ]]; then
  echo
  echo "--- Summary file ---"
  echo "$SUMMARY"
  echo "--- Summary head (first 250 lines) ---"
  sed -n '1,250p' "$SUMMARY"
else
  echo
  echo "No summary file found in $DOCS_DIR"
fi

EXEC_SUMMARY="$DOCS_DIR/EXEC_SUMMARY.md"
if [[ -f "$EXEC_SUMMARY" ]]; then
  echo
  echo "--- Project EXEC_SUMMARY (first 200 lines) ---"
  echo "$EXEC_SUMMARY"
  sed -n '1,200p' "$EXEC_SUMMARY"
fi

echo
echo "(Copy the above into Codex to resume.)"
