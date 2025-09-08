# MarkLeaf — MD-to-PDF Publisher

Soluzione web che converte file Markdown in PDF professionali tramite Pandoc + XeLaTeX, con template personalizzabili e supporto logo. Stack attuale: Flask + shell toolchain (`publish.sh`).

## Quickstart (locale)

- Prerequisiti: Python 3.11+, Pandoc, XeLaTeX (TeX Live/MacTeX), `make` (opzionale).
- Variabili d'ambiente (vedi `.env.example`):
  - `SESSION_SECRET` (consigliato in produzione)
  - `DATABASE_URL` (default SQLite locale)

Esecuzione:

```
python Toolchain/main.py
```

Apri il browser su `http://localhost:5000`.

## Struttura repo (essenziale)

- `Toolchain/app.py`: app Flask (endpoint UI, generazione PDF)
- `Toolchain/publish.sh`: orchestrazione Pandoc/XeLaTeX
- `Toolchain/Templates/…`: template LaTeX
- `Toolchain/static/…`: asset frontend
- `Governance/strategic_roadmap.md`: roadmap strategica
- `docs/…`: documentazione tecnica ed executive

## Deployment (outline)

- Dev: esecuzione locale + SQLite
- CI: GitHub Actions (lint/build placeholder)
- Prod: container (Dockerfile) su VM/servizio gestito; migrazione DB da SQLite a Postgres quando necessario

## Versioning e rilasci

- SemVer: `MAJOR.MINOR.PATCH`
- Branching: `main` stabile, `feat/*`, `fix/*`
- Tag rilasci: `vX.Y.Z` + GitHub Release

## Licenza

Da definire (MIT/Apache-2.0 consigliate). Fammi sapere la preferenza e la aggiungo.

## Contributing

- Segui la checklist PR in `CONTRIBUTING.md` per aprire richieste di merge coerenti e facili da revisionare.
- Flusso consigliato con GitHub Desktop: crea un branch da `main`, committa con Conventional Commits, push e apri una PR (merge via squash).
