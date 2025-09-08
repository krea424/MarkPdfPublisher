---
title: "MD-to-PDF Publisher — Strategic Roadmap"
author: "Moro Moromoro"
owner: "PM / Product"
project_name: "Brightledger"
project_code: "BLD-TC"
artifact_type: "ROADMAP"
version: "v1_0_0"
identifier: "BLD-TC_ROADMAP_MD2PDF_Strategic_v1_0_0_20250905"
location: "Governance/"
summary: "Roadmap cost‑effective per evolvere l’MVP MD→PDF in prodotto professionale, robusto e valutabile dal mercato, con deployment e scalabilità graduale."
usageterms: "Internal use – Brightledger"
ssot: true
status: "approved"
created: "2025-09-05"
updated: "2025-09-05"
tags: ["roadmap","product","md-pdf","toolchain","deploy"]
ai:
  generated: true
  model: "GPT-5 Thinking"
  prompt_id: "PROMPT-FW-0002"
---

# Obiettivo e Valore

- Missione: trasformare contenuti Markdown in PDF professionali, brand‑ready, con template premium e anteprima fluida.
- Valore per l’utente: riduzione dei tempi di impaginazione, qualità tipografica coerente, branding ripetibile, condivisione semplice.
- Segmenti iniziali: consulenti, agenzie, PM e team di vendita che generano SOW, offerte, report, whitepaper.
- Metriche guida: tasso successo conversione, tempo medio generazione, adozione template brand, retention mensile, NPS post‑export.

# Stato Attuale

- Frontend: HTML e Bootstrap 5; JavaScript vanilla; pdf.js locale per anteprima; dark mode, palette, effetto libro.
- Backend: Flask; endpoints per preview e generate; Pandoc e XeLaTeX; salvataggio temporaneo isolato.
- Punti di forza: qualità tipografica, semplicità d’uso, template multipli, preview interattiva.
- Gap: hardening errori Pandoc e LaTeX, log strutturati, containerizzazione, coda lavori per concorrenza, libreria template più ricca.

# Principi Guida

- Cost‑effective first: componenti open‑source e piani free; scalabilità a gradini.
- Toolchain‑compliant: aderire a Pandoc e XeLaTeX, senza estensioni proprietarie.
- Security e privacy by design: isolamento conversione, retention breve, log non sensibili.
- Misurabilità: log strutturati e health‑checks minimi fin dall’MVP.

# Roadmap per Fasi

## Fase 1 — Hardening MVP e UX Preview

- Robustezza conversione
  - Validazione input su estensioni, dimensioni ed encoding con messaggi risolutivi.
  - Lock versioni di Pandoc e TeXLive; script di bootstrap per ambienti riproducibili.
  - Pulizia sicura di directory temporanee; sanitizzazione nomi file.
- Template e impaginazione
  - Variabili uniformi; fallback font; gestione immagini raster e SVG; TOC parametrico.
- Preview e navigazione
  - Modalità Semplice e Avanzata; zoom percentuale; doppia pagina con copertina corretta; thumbnails numerate; mantenimento pagina corrente.
- Osservabilità
  - Logging strutturato JSON; endpoint healthz e readyz.

## Fase 2 — Valore Aggiunto e Personalizzazione

- Libreria template premium con 5–8 temi: consulting, executive, academic, whitepaper, one‑pager, datasheet.
- Branding: logo, palette e copertina parametrica; profili brand salvabili.
- Metadati: autore, cliente, data, versione, confidenzialità; merge in cover e header.
- Snippet riusabili: blocchi per KPI, note legali e CTA; shortcodes con riferimenti incrociati.

## Fase 3 — Collaborazione e Integrazioni

- Condivisione anteprima: link firmati a scadenza.
- Integrazioni free‑first
  - GitHub o GitLab per build PDF da repo Markdown.
  - Google Drive o Dropbox per import e export.
- Webhooks: notifica su conversione completata.

## Fase 4 — Sicurezza, Qualità e Compliance

- Test: unit e small e2e “golden PDF” toleranti; smoke sui template.
- Sicurezza: rate‑limit, scansione upload, isolamento processo di conversione, validazione percorsi.
- Privacy: policy, retention 24h dei file temporanei, DPA di riferimento.
- Telemetria opt‑in: eventi minimi non sensibili su esito e tempi.

## Fase 5 — Scalabilità e Packaging

- Containerizzazione: Dockerfile multi‑stage con layer TeX; compose per sviluppo locale.
- Web server: Gunicorn con worker asincroni; timeouts; health‑checks.
- Coda lavori: Redis free tier con RQ o Celery; conversioni asincrone; progress in UI.
- Storage S3‑compatible: MinIO in dev; bucket economici in prod; scadenza oggetti temporanei.
- CDN e protezione: Cloudflare per statici e WAF base.

# Deploy e Infrastruttura

- Dev
  - Docker Compose con web, worker, redis e minio opzionale; Makefile per bootstrap.
- Prod iniziale
  - PaaS container low‑cost come Fly io, Render o Railway per web e worker.
  - Redis managed free tier; Cloudflare proxy TLS e caching statici.
  - CI GitHub Actions: lint e test, build immagine, push su registry, deploy su main.
- Logging e monitoring
  - Log su stdout in JSON; viewer della piattaforma; uptime monitor con health‑check su healthz.

# Pricing e Posizionamento

- Free: conversioni limitate, template base, watermark removibile con upgrade.
- Pro individuale: template premium, branding salvato, link anteprima, nessun watermark.
- Team: profili brand condivisi, integrazioni, ruoli.
- Enterprise: SSO, audit log, deploy self‑host opzionale.

# Rischi e Mitigazioni

- Variabilità TeX: contenitori con versioni bloccate; script di bootstrap.
- Performance con immagini pesanti: preprocessing e caching artefatti; limiti dimensione.
- Template complessi: guideline e linter per variabili obbligatorie.
- Asset client: pdf.js locale versionato per evitare blocchi CDN.

# Metriche di Qualità

- Qualità PDF: frontmatter, cover, TOC e metadati; snapshot visivi dei primi pixel delle pagine chiave.
- Performance: tempo medio per pagina, deviazione standard, percentuale di timeout.
- Affidabilità: tasso di successo e tasso di retry.
- UX: NPS post‑export, uso di zoom e thumbnails, errori utente per task.

# Prossimi Passi Concreti

1. Containerizzare con Dockerfile multi‑stage e avvio con Gunicorn; healthz e readyz attivi.
2. Hardening preview: fit to width e fit to height; stabilità flip; conservazione pagina corrente.
3. Logging strutturato e uptime monitor; guida errori migliorata in UI.
4. Template premium v1 con tre nuovi temi; refactoring variabili condivise.
5. Pipeline CI su GitHub Actions e primo deploy su Fly io o Render.

# Allineamento con Governance

- Raccordo con i documenti di analisi nella cartella Governance per posizionamento e priorità.
- Inserire un executive summary delle evidenze di mercato nella prossima revisione del documento.
