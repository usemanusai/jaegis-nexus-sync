import fetch from 'node-fetch'

const RESEARCH = process.env.RESEARCH_URL || 'http://localhost:33011'

export async function enqueueResearch(url: string) {
  try {
    const r = await fetch(`${RESEARCH}/api/v1/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
    if (!r.ok) throw new Error('research enqueue failed')
    return await r.json()
  } catch (e) {
    return { ok: false }
  }
}

