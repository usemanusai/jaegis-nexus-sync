const RAG_INGEST = 'http://localhost:33001/api/v1/ingest'

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('nexus-sync-pulse', { periodInMinutes: 1 })
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'nexus-sync-pulse') {
    // Place for periodic syncs if needed
  }
})

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'NEXUS_SYNC_MESSAGE') {
    fetch(RAG_INGEST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: msg.source, content: msg.content })
    }).then(r=>r.json()).then((j)=>sendResponse({ok:true, jobId: j.jobId})).catch(()=>sendResponse({ok:false}))
    return true
  }
})

