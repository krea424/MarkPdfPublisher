# Workflow “Session logging + resume” (Europe/Rome)

## 1) Dove finiscono i dati
- Summary (tabella): `docs/CODEX_SESSION_LOG_YYYY-MM-DD.md`
- Transcript (completo): `docs/CODEX_TRANSCRIPTS/YYYY-MM-DD.md`
- Rollover giornaliero: automatico (nuovi file per ogni data)
- Sanitizer: `scripts/sanitize_transcript.py` (pulisce l’ultimo transcript)
- Chiusura rapida: `scripts/close_session.sh`

## 2) Cosa fa Codex ad ogni turno
1. Calcola DAY (YYYY-MM-DD) e TS (ISO 8601, fuso Europe/Rome)
2. Summary: aggiunge UNA riga alla tabella del giorno
3. Transcript: aggiunge DUE blocchi (user/codex) con lo STESSO TS
4. Mostra un DIFF combinato (solo i due file)
5. Redact di stringhe che sembrano segreti (API keys, token)

## 3) Durante la sessione
- Lavora normalmente in Codex: il logging è auto-attivo
- Check veloce:

```bash
tail -n 2 docs/CODEX_SESSION_LOG_YYYY-MM-DD.md
tail -n 12 docs/CODEX_TRANSCRIPTS/YYYY-MM-DD.md
```

## 4) Quando chiudi Cursor
- In Codex invia: `STOPLOG`.
- In Terminale esegui:

```bash
/Users/moromoro/Desktop/MarkPdfPublisher/scripts/close_session.sh
```

Output atteso: “Sanitized: …”, ultime 3 righe del summary, ultime 20 del transcript.

## 5) Quando riapri Cursor (ripresa del contesto)
In Codex incolla il Resume Prompt:

```text
Resume from saved context (read-only first).
Plan: read latest transcript + today’s summary, produce:
- Recent goals/decisions (≤8)
- Open questions (≤5)
- Next 3 concrete actions
Ask before running read-only commands; then ask me 1 question.
```

Rispondi “y” per i comandi read-only e usa il Context snapshot per ripartire.

---

## 5bis) Resume Prompt v2 (percorsi fissi, read-only)
Usa questo prompt quando riapri Cursor: evita la scansione dell’intero repo e legge solo i nostri log standard.

```text
Resume from saved context (read-only only). Paths are FIXED — do NOT scan the whole repo.

Locations:
Transcript files: docs/CODEX_TRANSCRIPTS/*.md (one per day: YYYY-MM-DD.md)
Summary files: docs/CODEX_SESSION_LOG_YYYY-MM-DD.md (one per day)

What to do:
Detect latest transcript by mtime.
Read that transcript (first 250 lines).
Read today’s summary (Europe/Rome); if not present, read the newest summary.
Produce a Context snapshot with:
- Recent goals/decisions (≤8 bullets)
- Open questions for me (≤5)
- Next 3 concrete actions with file paths
Ask me EXACTLY ONE clarifying question.
Never write files. Read-only only. Redact secrets-like strings in output.
```

Proposed read-only commands (ask before running, wait for my “y”):

```bash
# latest transcript by mtime
TRANSCRIPT=$(ls -t docs/CODEX_TRANSCRIPTS/*.md 2>/dev/null | head -n 1); echo "$TRANSCRIPT"; sed -n '1,250p' "$TRANSCRIPT"

# today’s summary (Europe/Rome), fallback to newest
DAY=$(TZ=Europe/Rome date +%F)
SUMMARY="docs/CODEX_SESSION_LOG_${DAY}.md"
if [ ! -f "$SUMMARY" ]; then SUMMARY=$(ls -t docs/CODEX_SESSION_LOG_*.md 2>/dev/null | head -n 1); fi
echo "$SUMMARY"; sed -n '1,250p' "$SUMMARY"
```

---

## 5ter) Resume Prompt v3 (ieri/oggi fallback, read-only)
Prompt aggiornato: preferisce i file di ieri (Europe/Rome) se presenti, poi oggi, altrimenti il più recente per mtime.

```text
Resume from saved context (read-only only). Paths are FIXED — do NOT scan the repo.

Locations:
- Transcript files: docs/CODEX_TRANSCRIPTS/*.md (one per day: YYYY-MM-DD.md)
- Summary files: docs/CODEX_SESSION_LOG_YYYY-MM-DD.md (one per day)

What to do (read-only):
- Prefer yesterday’s files (Europe/Rome) if they exist, else use today’s, else fallback to newest by mtime.
- Produce: Recent goals/decisions (≤8), Open questions (≤5), Next 3 actions (with file paths).
- Ask me EXACTLY ONE clarifying question. Redact secrets-like strings.
```

Proposed read-only commands (ask before running, wait for my “y”):

```bash
# Compute DAY/YDAY (Europe/Rome)
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

# Pick transcript: prefer YDAY if present, else latest by mtime
TRANSCRIPT="docs/CODEX_TRANSCRIPTS/${YDAY}.md"
if [ ! -f "$TRANSCRIPT" ]; then
  TRANSCRIPT=$(ls -t docs/CODEX_TRANSCRIPTS/*.md 2>/dev/null | head -n 1)
fi
echo "$TRANSCRIPT"; sed -n '1,250p' "$TRANSCRIPT"

# Pick summary: prefer TODAY, else YDAY, else newest
SUMMARY="docs/CODEX_SESSION_LOG_${DAY}.md"
if [ ! -f "$SUMMARY" ]; then
  ALT="docs/CODEX_SESSION_LOG_${YDAY}.md"
  if [ -f "$ALT" ]; then SUMMARY="$ALT"; else SUMMARY=$(ls -t docs/CODEX_SESSION_LOG_*.md 2>/dev/null | head -n 1); fi
fi
echo "$SUMMARY"; sed -n '1,250p' "$SUMMARY"
```

Suggerimento: all’apertura esegui prima `scripts/start_session.sh` così i file del giorno vengono creati se mancanti.

---

## 5quater) Start/Close session (operativo)
- All’apertura di Cursor (idempotente):

```bash
/Users/moromoro/Desktop/MarkPdfPublisher/scripts/start_session.sh
```

- Alla chiusura (dopo aver scritto `STOPLOG` in Codex):

```bash
/Users/moromoro/Desktop/MarkPdfPublisher/scripts/close_session.sh
```

---

## 5quinquies) Resume helper script (read-only)
Per comodità puoi usare uno script che esegue i comandi read-only del Resume v3 e stampa lo snapshot pronto da copiare in Codex.

```bash
/Users/moromoro/Desktop/MarkPdfPublisher/scripts/resume_context.sh
```

Output incluso:
- Transcript head (prime 250 righe) e tail (ultime 120)
- Summary head (prime 250 righe) del file di oggi o di ieri
- EXEC_SUMMARY.md (prime 200 righe), se presente

---

## 6) Sanitizer (quando e cosa fa)
Eseguilo dopo STOPLOG o se vedi “rumore” (tabelle/contesto IDE nei blocchi user):

```bash
python3 /Users/moromoro/Desktop/MarkPdfPublisher/scripts/sanitize_transcript.py
```

Mantiene solo blocchi puliti, ordina user→codex per timestamp, elimina righe spurie.

## 7) Troubleshooting rapido
- Tabella aggiornata ma transcript incompleto: esegui il sanitizer
- Transcript con testo extra (policy, tabelle): sanitizer
- Non logga più: forse hai lasciato STOPLOG; re-incolla la policy in Codex
- Rollover mancato: verifica il nome file del giorno nel summary
- Sicurezza: se compaiono variabili tipo GITHUB_TOKEN, GEMINI_API_KEY, ruota le chiavi

## 8) Mini cheat‑sheet

```bash
# Ultime righe di oggi
tail -n 3 docs/CODEX_SESSION_LOG_YYYY-MM-DD.md
tail -n 20 docs/CODEX_TRANSCRIPTS/YYYY-MM-DD.md

# Cerca un timestamp nel transcript
grep -n "2025-09-06T12:33" docs/CODEX_TRANSCRIPTS/2025-09-06.md

# Sanitize ultimo transcript
python3 scripts/sanitize_transcript.py

# Chiusura sessione (STOPLOG prima!)
scripts/close_session.sh
```
