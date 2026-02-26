# vero-market-intelligence

## Backend (FastAPI + SQLite + SQLAlchemy)

### Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload
```

API will be available at `http://127.0.0.1:8000`.

### Notes
- SQLite database file is stored at `backend/db.sqlite3`.
- `POST /countries` validates all score inputs are between `0` and `10`.
- `GET /countries` returns all countries from the database.
- `POST /score` loads countries from the database and returns ranked scores.
