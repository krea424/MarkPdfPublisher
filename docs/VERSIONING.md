# Versioning & Release

- Schema: SemVer (MAJOR.MINOR.PATCH)
- Branching: `main` stabile; feature su `feat/*`; fix su `fix/*`.
- Commit: Conventional Commits consigliati (es. `feat: aggiunge preview`).
- Tag: `vX.Y.Z` su `main`.
- Release: GitHub Release con note generate dai commit.

## Passi pratici

1. Crea il repo Git (se non esiste): `git init` e primo commit.
2. Aggiungi remoto GitHub: `git remote add origin git@github.com:<org>/<repo>.git`.
3. Lavoro su branch: `git checkout -b feat/preview`.
4. PR verso `main`, squash & merge.
5. Tagga una versione: `git tag v0.1.0 && git push --tags`.
6. Pubblica Release in GitHub.

