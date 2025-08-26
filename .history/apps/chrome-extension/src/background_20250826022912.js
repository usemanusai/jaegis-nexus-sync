const DEFAULT_INGEST = 'http://localhost:33001/api/v1/ingest'

async function getIngestUrl() {
  const { RAG_INGEST } = await chrome.storage.local.get(['RAG_INGEST'])
  return RAG_INGEST || DEFAULT_INGEST
}

async function pushQueue() {
  const ingest = await getIngestUrl()
  const { queue = [] } = await chrome.storage.local.get(['queue'])
  const next = queue.shift()
  if (!next) return
  try {
    const { RAG_API_KEY } = await chrome.storage.local.get(['RAG_API_KEY'])
    const res = await fetch(ingest, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(RAG_API_KEY ? { 'x-api-key': RAG_API_KEY } : {}) },
      body: JSON.stringify(next),
    })
    if (!res.ok) throw new Error('non-200')
  } catch (e) {
    // requeue with backoff marker
    next.retries = (next.retries || 0) + 1
    if (next.retries < 5) queue.unshift(next)
  }
  await chrome.storage.local.set({ queue })
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('nexus-sync-pulse', { periodInMinutes: 0.5 })
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'nexus-sync-pulse') {
    pushQueue()
  }
})

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg?.type === 'NEXUS_SYNC_MESSAGE') {
    const { queue = [] } = await chrome.storage.local.get(['queue'])
    queue.push({ source: msg.source, content: msg.content, ts: Date.now() })
    await chrome.storage.local.set({ queue })
    sendResponse({ ok: true, queued: queue.length })
    return true
  }
  if (msg?.type === 'NEXUS_SYNC_SET_ENDPOINT') {
    await chrome.storage.local.set({ RAG_INGEST: msg.url })
    sendResponse({ ok: true })
    return true
  }
})

