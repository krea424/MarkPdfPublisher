# Architettura

- Frontend: HTML/Bootstrap + JS custom (`Toolchain/static/js/app.js`).
- Backend: Flask (`Toolchain/app.py`). Endpoint principali: `GET /`, `POST /generate`, `POST /preview-pdf` (nuovo).
- Toolchain: `Toolchain/publish.sh` invoca Pandoc + XeLaTeX con template LaTeX.
- Storage: inizialmente SQLite via SQLAlchemy (Flask‑SQLAlchemy). Scalabile a Postgres.

## Decisioni chiave

- Mantenere Flask per time‑to‑market e semplicità; valutare FastAPI in futuro per API estese.
- Usare SQLite in dev/poC e migrare a Postgres in produzione (stesso ORM, stringa connessione diversa).
- Config 12‑factor via env; nessun segreto in repo.

## Sicurezza e robustezza

- Validazione input (tipo/size file), nomi sicuri, esecuzione Pandoc con timeout, directory temporanee isolate e cleanup.
- Invio PDF in memoria (evita TOCTOU su file temporanei) e logging strutturato.
