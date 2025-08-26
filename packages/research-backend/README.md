# NexusSync Research Backend (FastAPI + Celery + Playwright)

Custom Ports:
- Redis: 56379
- RAG ingest: http://localhost:33001/api/v1/ingest

Run locally (Python 3.11 recommended):

```
python -m venv .venv
. .venv/Scripts/activate  # or source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

Start services:

```
# API
uvicorn app.main:app --host 0.0.0.0 --port 33011

# Celery worker
celery -A app.tasks.celery_app worker --loglevel=info
```

