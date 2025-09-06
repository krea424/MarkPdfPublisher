# Contributing

- Apri issue con descrizione chiara (bug/feature/question).
- Usa branch `feat/*` o `fix/*` e PR piccole e focalizzate.
- Stile commit: Conventional Commits.
- Coding style: PEP8; esegui `ruff` (opzionale) prima della PR.
- Test: aggiungi test unit per nuove funzioni quando introdurremo pytest.

## Checklist PR (professionale)

Prima di iniziare
- [ ] Sei aggiornato con `main` (Fetch/Pull in GitHub Desktop)?
- [ ] Hai creato un branch dedicato `type/short-topic` (es. `feat/pdf-preview`)?

Commit & contenuti
- [ ] Il titolo del commit/PR segue Conventional Commits (`type(scope): subject`)?
- [ ] La PR è piccola e a singolo scopo (≤ ~400 LOC)?
- [ ] Nessun segreto incluso (.env, token, chiavi, credenziali)?
- [ ] Documentazione aggiornata se serve (README, docs/…)?

Descrizione PR
- [ ] Summary: perché serve il cambiamento e risultato per l’utente.
- [ ] Changes: elenco puntato delle modifiche principali.
- [ ] Testing: passi per verificare (comandi, risultati attesi, edge cases).
- [ ] Screenshot/log utili allegati (se UI o errori significativi).
- [ ] Issue collegata (es. `Closes #123`).

Qualità & CI
- [ ] `python -m compileall Toolchain` locale ok (se applicabile).
- [ ] `ruff check Toolchain` eseguito (non bloccante ma consigliato).
- [ ] CI su GitHub è verde: “CI / build (ubuntu-latest)”.

Review & merge
- [ ] Hai richiesto review (min. 1) e risposto ai commenti?
- [ ] Nessun conflitto: base aggiornata con `main`.
- [ ] Merge strategy: Squash and merge.
- [ ] Elimina il branch remoto dopo il merge.

Post‑merge
- [ ] In Desktop: passa a `main` e fai Pull.
- [ ] Elimina il branch locale mergiato.
