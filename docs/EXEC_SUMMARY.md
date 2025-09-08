# Executive Summary

MarkLeaf abilita la produzione rapida di PDF professionali partendo da Markdown, riducendo tempi e costi rispetto a impaginazioni manuali. Architettura leggera (Flask + Pandoc) per time‑to‑market e costi minimi, con percorso di crescita verso storage strutturato (Postgres), CI/CD e container.

- Proposta di valore: velocità, qualità, ripetibilità.
- Costi: minimi (open‑source), hosting low‑cost; scalabile.
- Rischi principali: dipendenze LaTeX/Font; mitigazione con container image.
- Prossimi step: rafforzare backend (storage/logging), CI, container, rilascio 0.1.

## Aggiornamento 2025‑09‑08 (stato e azioni chiave)

- Stabilizzazione PR: risolti conflitti con `main`, rimosso backup duplicato, allineati i file di workflow e script di resume.
- Qualità/DevEx: introdotti hook pre‑commit core (whitespace/EOL/merge‑conflict/large files) ed esecuzione in CI; normalizzati molti file.
- Versioning/Release: creato `CHANGELOG.md` (Keep a Changelog) e abilitato Release Drafter per note automatiche da PR/label.
- Ignores: esclusa la venv locale `Toolchain/.venv/` dal tracking Git.
- Logging operativo: inizializzazione giornaliera attiva; backfill sintetico dei log del 2025‑09‑08 completato.

### Decisioni
- Conventional Commits consigliati; SemVer applicato (file `VERSION` attuale: 0.1.0).
- Branch `main` stabile; CI obbligatoria con hook pre‑commit.

### Prossimi step (proposti)
- Versione 0.1.1 (patch): bump `VERSION`, tag annotato `v0.1.1`, Release Draft su GitHub.
- Documentazione contributi: aggiungere `CONTRIBUTING.md`, `.github/CODEOWNERS`, issue templates (bug/feature).
- Linting graduale: integrare `ruff` (check) e valutare `black` con migrazione controllata.
- Container: finalizzare immagine e test base su CI (esiste `Dockerfile`).
- Test di base: aggiungere smoke test su endpoint principali Flask e su pipeline di generazione PDF.
