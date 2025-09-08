#!/usr/bin/env bash
set -euo pipefail

# Initialize today’s daily log files if missing (Europe/Rome)
# - Creates docs/CODEX_SESSION_LOG_YYYY-MM-DD.md with table header
# - Creates docs/CODEX_TRANSCRIPTS/YYYY-MM-DD.md with title
# Idempotent: safe to run multiple times.

BASE="/Users/moromoro/Desktop/MarkPdfPublisher"
DAY="$(TZ=Europe/Rome date +%F)"

DOCS_DIR="$BASE/docs"
TX_DIR="$DOCS_DIR/CODEX_TRANSCRIPTS"
SUMMARY_FILE="$DOCS_DIR/CODEX_SESSION_LOG_${DAY}.md"
TRANSCRIPT_FILE="$TX_DIR/${DAY}.md"

mkdir -p "$TX_DIR"

if [[ ! -f "$SUMMARY_FILE" ]]; then
  cat >"$SUMMARY_FILE" <<EOF
# Codex Session Log – ${DAY}

> Append-only log of Codex IDE agent conversations for MarkPdfPublisher.

| Timestamp | Actor | Summary | Files changed | Commit suggested |
|---|---|---|---|---|
EOF
  echo "Initialized summary: $SUMMARY_FILE"
else
  echo "Summary already present: $SUMMARY_FILE"
fi

if [[ ! -f "$TRANSCRIPT_FILE" ]]; then
  cat >"$TRANSCRIPT_FILE" <<EOF
# Codex Full Transcript — ${DAY}

EOF
  echo "Initialized transcript: $TRANSCRIPT_FILE"
else
  echo "Transcript already present: $TRANSCRIPT_FILE"
fi

echo "Start session done for DAY=${DAY} (Europe/Rome)."

