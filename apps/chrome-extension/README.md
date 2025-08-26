# NexusSync Chrome Extension

Build & Load (Developer):

1. npm -w apps/chrome-extension install
2. npm -w apps/chrome-extension run build
3. In Chrome, go to chrome://extensions, enable Developer Mode
4. Load unpacked, choose apps/chrome-extension/dist

Options:
- Set custom RAG Ingest URL in the Options page

Notes:
- Content scripts use heuristics for Gemini and chat.z.ai; refine selectors as needed
- Background queues messages and retries with backoff; periodic push via alarms
- Bulk export chunks long messages and deduplicates by signature

