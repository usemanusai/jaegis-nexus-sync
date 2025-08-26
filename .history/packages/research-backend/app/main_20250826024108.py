import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from celery import Celery
import redis
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:56379")
RAG_INGEST_URL = os.getenv("RAG_INGEST_URL", "http://localhost:33001/api/v1/ingest")

app = FastAPI(title="NexusSync Research Backend")

# CORS for local web-ui
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

celery_app = Celery("research", broker=REDIS_URL, backend=REDIS_URL)

r = redis.Redis.from_url(REDIS_URL)

class ResearchRequest(BaseModel):
    url: HttpUrl

@app.post("/api/v1/research")
def create_research(req: ResearchRequest):
    job = celery_app.send_task("tasks.scrape_and_ingest", args=[str(req.url), RAG_INGEST_URL])
    return {"job_id": job.id}

@app.get("/api/v1/research/{job_id}")
def get_status(job_id: str):
    res = celery_app.AsyncResult(job_id)
    body = {"job_id": job_id, "status": res.status}
    if res.ready():
        try:
            body["result"] = res.result
        except Exception:
            body["result"] = None
    return body

@app.get("/api/v1/health")
def health():
    return {"status":"ok"}

