const DEFAULT_INGEST = 'http://localhost:33001/api/v1/ingest'
async function isAgi() { const { AGI_MODE } = await chrome.storage.local.get(['AGI_MODE']); return !!AGI_MODE }


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

// AGI handlers merged here
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse)=>{
  if (msg?.type === 'AGI_NAV' && msg.url) {
    isAgi().then((on)=>{
      if (!on) return sendResponse({ ok: false, error: 'AGI disabled' })
      chrome.tabs.create({ url: msg.url }).then(tab=> sendResponse({ ok: true, tabId: tab.id }))
    })
    return true
  }
  if (msg?.type === 'AGI_EXEC' && msg.tabId && msg.code) {
    isAgi().then(async (on)=>{
      if (!on) return sendResponse({ ok: false, error: 'AGI disabled' })
      try {
        if (!(await checkAllow(msg.tabId))) return sendResponse({ ok:false, error: 'Host not allowlisted' })
        await chrome.scripting.executeScript({ target: { tabId: msg.tabId }, func: new Function(msg.code) })
        sendResponse({ ok: true })
      } catch (e) { sendResponse({ ok: false, error: String(e) }) }
    })
    return true
  }
})


async function checkAllow(tabId){
  const { AGI_ALLOWLIST=[] } = await chrome.storage.local.get(['AGI_ALLOWLIST'])
  if (!AGI_ALLOWLIST.length) return true
  const tab = await chrome.tabs.get(tabId)
  try { const u = new URL(tab.url||'') ; return AGI_ALLOWLIST.some(h=>u.hostname.endsWith(h)) } catch { return false }
}
async function requestOriginPermission(origin){
  try {
    const granted = await chrome.permissions.request({ origins: [origin] })
    return granted
  } catch { return false }
}

async function inject(tabId, func, args=[]) {
  const [{ result }] = await chrome.scripting.executeScript({ target: { tabId }, func, args })
  return result
}

async function runDsl(tabId, dsl) {
  let last = null
  for (const step of dsl?.steps||[]) {
    if (step.type === 'navigate') {
      try {
        const u = new URL(step.url)
        const origin = `${u.protocol}//${u.host}/*`
        if (!(await checkAllow(tabId))) return { ok:false, error: 'Host not allowlisted' }
        await requestOriginPermission(origin)
        await chrome.tabs.update(tabId, { url: step.url })
      } catch (e) { return { ok:false, error: String(e) } }
    }
    if (step.type === 'wait') {
      await new Promise(r=>setTimeout(r, Number(step.ms||500)))
    }
    if (step.type === 'click') {
      last = await inject(tabId, (sel)=>{ const el=document.querySelector(sel); el?.click(); return !!el }, [step.selector])
    }
    if (step.type === 'type') {
      last = await inject(tabId, (sel,txt)=>{ const el=document.querySelector(sel); if(el){ el.focus(); el.value=txt; el.dispatchEvent(new Event('input',{bubbles:true})) } return !!el }, [step.selector, step.text||''])
    }
    if (step.type === 'submit') {
      last = await inject(tabId, (sel)=>{ const el=document.querySelector(sel); const f=el?.form||document.querySelector('form'); f?.dispatchEvent(new Event('submit',{bubbles:true})); return !!f }, [step.selector||''])
    }
    if (step.type === 'extract') {
      last = await inject(tabId, (sel,attr)=>{ const el=document.querySelector(sel); if(!el) return ''; return attr? (el.getAttribute(attr)||'') : (el.textContent||'') }, [step.selector, step.attribute||''])
    }
    if (step.type === 'rag_ingest') {
      const source = step.source || 'agi://workflow'
      const content = step.from === 'lastExtract' ? String(last||'') : String(step.value||'')
      await chrome.runtime.sendMessage({ type: 'NEXUS_SYNC_MESSAGE', source, content })
    }
  }
  return { ok: true, last }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse)=>{
  if (msg?.type === 'AGI_RUN_DSL' && msg.tabId && msg.dsl) {
    isAgi().then(async (on)=>{
      if (!on) return sendResponse({ ok:false, error:'AGI disabled' })
      try {
        const res = await runDsl(msg.tabId, msg.dsl)
        sendResponse(res)
      } catch(e){ sendResponse({ ok:false, error:String(e) }) }
    })
    return true
  }
})

