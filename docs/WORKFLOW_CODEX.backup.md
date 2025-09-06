# Workflow “Session logging + resume” (Europe/Rome)

## 1) Dove finiscono i dati
- **Summary (tabella):** `docs/CODEX_SESSION_LOG_YYYY-MM-DD.md`  
- **Transcript (completo):** `docs/CODEX_TRANSCRIPTS/YYYY-MM-DD.md`  
- **Rollover giornaliero:** automatico (nuovi file per ogni data).  
- **Sanitizer:** `scripts/sanitize_transcript.py` (pulisce l’ultimo transcript).  
- **Chiusura rapida:** `scripts/close_session.sh`.

## 2) Cosa fa Codex ad ogni turno
1. Calcola **DAY** (YYYY-MM-DD) e **TS** (ISO 8601 con fuso Europe/Rome).  
2. **Summary:** aggiunge **una riga** alla tabella del giorno.  
3. **Transcript:** aggiunge **due blocchi** (user/codex) con lo **stesso TS**.  
4. Mostra **diff combinato** (solo i due file).  
5. **Redact** di stringhe che sembrano segreti (API keys, token).  

## 3) Durante la sessione
- Lavora normalmente in Codex: il logging è **auto-attivo**.  
- Check veloce:
  ```bash
  tail -n 2 docs/CODEX_SESSION_LOG_YYYY-MM-DD.md
  tail -n 12 docs/CODEX_TRANSCRIPTS/YYYY-MM-DD.md
4) Quando chiudi Cursor
In Codex invia: STOPLOG.

In Terminale:

bash
Copy code
/Users/moromoro/Desktop/MarkPdfPublisher/scripts/close_session.sh
Output atteso: Sanitized: …, ultime 3 righe del summary, ultime 20 del transcript.

5) Quando riapri Cursor (ripresa del contesto)
In Codex incolla il Resume Prompt:

sql
Copy code
Resume from saved context (read-only first).
Plan: read latest transcript + today’s summary, produce:
- Recent goals/decisions (≤8)
- Open questions (≤5)
- Next 3 concrete actions
Ask before running read-only commands; then ask me 1 question.
Rispondi y per i comandi read-only e usa il Context snapshot per ripartire.

6) Sanitizer (quando e cosa fa)
Eseguilo dopo STOPLOG o se vedi “rumore” (tabelle/contesto IDE nei blocchi user):

bash
Copy code
python3 /Users/moromoro/Desktop/MarkPdfPublisher/scripts/sanitize_transcript.py
Mantiene solo blocchi puliti, ordina user→codex per timestamp, elimina righe spurie.

7) Troubleshooting rapido
Tabella aggiornata ma transcript incompleto: esegui il sanitizer.

Transcript con testo extra (policy, tabelle): sanitizer.

Non logga più: forse hai lasciato STOPLOG; re-incolla la policy in Codex.

Rollover mancato: verifica il nome file del giorno nel summary.

Sicurezza: se compaiono variabili tipo GITHUB_TOKEN, GEMINI_API_KEY, ruota le chiavi.

8) Mini cheat-sheet
bash
Copy code
# Ultime righe di oggi
tail -n 3 docs/CODEX_SESSION_LOG_YYYY-MM-DD.md
tail -n 20 docs/CODEX_TRANSCRIPTS/YYYY-MM-DD.md

# Cerca un timestamp nel transcript
grep -n "2025-09-06T12:33" docs/CODEX_TRANSCRIPTS/2025-09-06.md

# Sanitize ultimo transcript
python3 scripts/sanitize_transcript.py

# Chiusura sessione (STOPLOG prima!)
scripts/close_session.sh
