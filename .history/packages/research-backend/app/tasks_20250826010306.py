import os
import httpx
from bs4 import BeautifulSoup
from celery import Celery
from playwright.sync_api import sync_playwright

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:56379")

celery_app = Celery(
    "research",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

@celery_app.task(name="tasks.scrape_and_ingest")
def scrape_and_ingest(url: str, ingest_url: str):
    # Use Playwright to fetch and get rendered HTML (headless)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, wait_until="domcontentloaded")
        html = page.content()
        browser.close()

    soup = BeautifulSoup(html, "lxml")
    text = soup.get_text(separator="\n", strip=True)
    payload = {"source": url, "content": text[:10000]}

    try:
        with httpx.Client(timeout=30.0) as client:
            r = client.post(ingest_url, json=payload)
            r.raise_for_status()
    except Exception as e:
        return {"ok": False, "error": str(e)}

    return {"ok": True}

