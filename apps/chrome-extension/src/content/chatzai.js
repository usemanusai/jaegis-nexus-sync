function hash(s){let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0}return String(h)}
function getThreadId(){
  // Use URL hash/path for per-thread tracking
  return location.pathname + location.hash
}
function extractMessages() {
  // Heuristic selectors; refine with platform updates
  const nodes = Array.from(document.querySelectorAll('[data-message], article, .message, [role="listitem"]'))
  return nodes.map(n => n.textContent.trim()).filter(Boolean)
}
async function maybeSendNew() {
  const msgs = extractMessages(); if (!msgs.length) return
  const thread = getThreadId(); const last = msgs[msgs.length-1]
  const key = `nx_zai_${thread}`; const sig = hash(last)
  const stored = await chrome.storage.local.get([key]);
  if (stored[key] === sig) return; // dedupe
  await chrome.storage.local.set({ [key]: sig })
  chrome.runtime.sendMessage({ type: 'NEXUS_SYNC_MESSAGE', source: location.href, content: last })
}
const obs = new MutationObserver(()=>{ maybeSendNew() })
obs.observe(document.documentElement, { childList: true, subtree: true })
setInterval(maybeSendNew, 5000)

