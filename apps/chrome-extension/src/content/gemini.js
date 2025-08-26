function hash(s){let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0}return String(h)}
function getThreadId(){
  // Use URL path as thread ID fallback
  return location.pathname || 'gemini-root'
}
function extractMessages() {
  // Heuristic: Gemini uses role-based message containers; refine as needed
  const nodes = Array.from(document.querySelectorAll('[data-message], [data-content], article, .message'))
  return nodes.map(n => n.textContent.trim()).filter(Boolean)
}
async function maybeSendNew() {
  const msgs = extractMessages(); if (msgs.length===0) return
  const thread = getThreadId(); const last = msgs[msgs.length-1]
  const key = `nx_gem_${thread}`; const sig = hash(last)
  const stored = await chrome.storage.local.get([key]);
  if (stored[key] === sig) return; // dedupe
  await chrome.storage.local.set({ [key]: sig })
  chrome.runtime.sendMessage({ type: 'NEXUS_SYNC_MESSAGE', source: location.href, content: last })
}
const obs = new MutationObserver(()=>{ maybeSendNew() })
obs.observe(document.documentElement, { childList: true, subtree: true })
setInterval(maybeSendNew, 5000)

