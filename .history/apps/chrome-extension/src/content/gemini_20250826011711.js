function extractMessages() {
  // Simple DOM scan; real selector tuning needed for Gemini
  const nodes = Array.from(document.querySelectorAll('[data-message]'))
  return nodes.map(n => n.textContent.trim()).filter(Boolean)
}

function sendLastMessage() {
  const msgs = extractMessages()
  if (msgs.length === 0) return
  const last = msgs[msgs.length-1]
  chrome.runtime.sendMessage({ type: 'NEXUS_SYNC_MESSAGE', source: location.href, content: last })
}

const obs = new MutationObserver(()=>sendLastMessage())
obs.observe(document.documentElement, { childList: true, subtree: true })

