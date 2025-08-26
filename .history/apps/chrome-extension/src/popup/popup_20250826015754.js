document.getElementById('bulk').addEventListener('click', async ()=>{
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async () => {
      function wait(ms){return new Promise(r=>setTimeout(r, ms))}
      const CHUNK = 4000
      let seen = new Set()
      for (let i=0;i<20;i++) {
        window.scrollTo(0, document.body.scrollHeight)
        await wait(600)
        const nodes = Array.from(document.querySelectorAll('[data-message], article, .message, [role="listitem"]'))
        const msgs = nodes.map(n=>n.textContent.trim()).filter(Boolean)
        for (const m of msgs) {
          const sig = m.slice(0,100)
          if (seen.has(sig)) continue
          seen.add(sig)
          for (let j=0;j<m.length;j+=CHUNK) {
            const piece = m.slice(j, j+CHUNK)
            chrome.runtime.sendMessage({ type: 'NEXUS_SYNC_MESSAGE', source: location.href, content: piece })
            await wait(100)
          }
        }
      }
    }
  })
})

