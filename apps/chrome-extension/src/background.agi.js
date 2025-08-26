async function isAgi() {
  const { AGI_MODE } = await chrome.storage.local.get(['AGI_MODE'])
  return !!AGI_MODE
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
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
        await chrome.scripting.executeScript({ target: { tabId: msg.tabId }, func: new Function(msg.code) })
        sendResponse({ ok: true })
      } catch (e) { sendResponse({ ok: false, error: String(e) }) }
    })
    return true
  }
})

