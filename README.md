# MarkLeaf — MD-to-PDF Publisher

Soluzione web che converte file Markdown in PDF professionali tramite Pandoc + XeLaTeX, con template personalizzabili e supporto logo. Stack attuale: Flask + shell toolchain (`publish.sh`).

## Features

- **Dual Generation Modes**:
  - **Upload Mode**: The classic web UI allows users to upload a Markdown file, and the generated PDF is downloaded back to their browser. Safe and ideal for general use.
  - **Local Path Mode**: A powerful mode for trusted environments. Provide an absolute path to a Markdown file on the server, and `MarkPdfPublisher` will generate the PDF right next to it. Perfect for local development, automation scripts, or integrating with other tools like Obsidian.
- **Multiple Premium Templates**: Choose between `classic`, `consulting`, and the beautiful `Eisvogel` LaTeX template for typographically stunning documents.
- **Customizable Output**:
  - Add a company logo (PNG, SVG, PDF, JPG).
  - Generate beautiful documents with premium templates.
  - Control Table of Contents (TOC) generation and depth.
- **Live Preview**: Get a quick preview of your document's layout before generating the final PDF.
- **Simple REST API**: All functionalities are exposed via a clean API, making it easy to integrate `MarkPdfPublisher` into your own workflows.
- **Database Logging**: Keeps a record of all generation jobs, including status, template used, and timestamps.

---

## ⚠️ Security Note on Local Path Mode

The **Local Path Mode** is a powerful feature designed for use in **trusted, controlled environments only**. It operates by accepting an absolute file path from an API call and writing the output PDF to the same directory.

**Do not expose this application to the public internet or untrusted users with Local Path Mode enabled.**

An unauthorized user with access to the `/generate-by-path` endpoint could potentially:
- **Read file structure**: By probing different paths, an attacker could determine if certain files or directories exist on your server.
- **Write files to arbitrary locations**: While the application is designed to write the PDF next to the source, a vulnerability could potentially be exploited to write files elsewhere.
- **Denial of Service**: Triggering PDF generation on very large or complex Markdown files could consume significant server resources (CPU, memory), leading to a denial of service.

### Mitigation

- **Run in a container**: Use Docker or another containerization technology to isolate the application from the host filesystem.
- **Use a dedicated, non-privileged user**: Run the application process under a user with limited file permissions.
- **Firewall/Reverse Proxy**: If you must expose the UI, use a reverse proxy (like Nginx or Caddy) to block public access to the `/generate-by-path` API endpoint.
- **Authentication**: For any production-like use case, implement an authentication layer in front of the application.

---

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
