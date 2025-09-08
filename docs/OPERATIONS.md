# Operations

## Running

- Dev: `python Toolchain/main.py`
- Prod (gunicorn): `gunicorn -w 2 -b 0.0.0.0:8080 'app:app'` dalla cartella `Toolchain/`.

## Config

- `SESSION_SECRET`: chiave sessione Flask
- `DATABASE_URL`: `sqlite:///instance/markleaf.db` (default) o Postgres
- `FLASK_ENV`: `development`/`production`

## Database

- Default SQLite file in `Toolchain/instance/markleaf.db` (creato al boot se mancante)
- Migrazione a Postgres cambiando `DATABASE_URL` (si consiglia Alembic per migrazioni future)

## Backup e log

- Backup DB: copia file `instance/markleaf.db` a caldo con lock o a freddo.
- Log: stdout/stderr (container) o file via configurazione logging.

## Health/Monitoring

- Aggiungere endpoint `/healthz` (TODO) e metrics (es. Prometheus) in fase 2.
