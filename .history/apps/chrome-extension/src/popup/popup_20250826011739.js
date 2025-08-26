document.getElementById('bulk').addEventListener('click', async ()=>{
  // naive bulk: try to scroll and capture messages on active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async () => {
      function wait(ms){return new Promise(r=>setTimeout(r, ms))}
      for (let i=0;i<10;i++) {
        window.scrollTo(0, document.body.scrollHeight)
        await wait(800)
      }
      const nodes = Array.from(document.querySelectorAll('[data-message]'))
      const text = nodes.map(n => n.textContent.trim()).filter(Boolean).join('\n')
      chrome.runtime.sendMessage({ type: 'NEXUS_SYNC_MESSAGE', source: location.href, content: text })
    }
  })
})

