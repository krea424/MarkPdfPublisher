# Security Notes

- File upload:
  - Consentiti: `.md` (contenuto), immagini logo (`png, svg, pdf, jpg, jpeg`).
  - Limite size 16MB.
  - Nomi file sanificati (`secure_filename`).
- Esecuzione Pandoc:
  - Timeout e cattura stderr.
  - Directory temporanee isolate per richiesta, con cleanup.
- Dati:
  - Nessun dato persistente sensibile; job log su DB per audit base.
- Produzione:
  - Impostare `SESSION_SECRET` forte.
  - Eseguire dietro reverse proxy (Nginx) e HTTPS.
  - Valutare sandboxing Pandoc e quota temporanei.
