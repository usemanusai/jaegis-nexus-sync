import React, { useState } from 'react'

const RESEARCH_API = import.meta.env.VITE_RESEARCH_API || 'http://localhost:33011'

export function App() {
  const [url, setUrl] = useState('https://example.com')
  const [job, setJob] = useState<string | null>(null)
  const [status, setStatus] = useState<any>(null)

  async function startResearch(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch(`${RESEARCH_API}/api/v1/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    const json = await res.json()
    setJob(json.job_id)
  }

  async function pollStatus() {
    if (!job) return
    const res = await fetch(`${RESEARCH_API}/api/v1/research/${job}`)
    const json = await res.json()
    setStatus(json)
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">NexusSync Research UI</h1>
      <form onSubmit={startResearch} className="space-x-2">
        <input value={url} onChange={(e)=>setUrl(e.target.value)} className="px-2 py-1 rounded text-black w-96" placeholder="https://..." />
        <button className="bg-blue-600 px-3 py-1 rounded">Start</button>
      </form>

      {job && (
        <div className="mt-4">
          <div>Job: {job}</div>
          <button onClick={pollStatus} className="bg-slate-700 px-3 py-1 rounded mt-2">Poll Status</button>
        </div>
      )}

      {status && (
        <pre className="mt-4 bg-black/40 p-4 rounded">{JSON.stringify(status, null, 2)}</pre>
      )}
    </div>
  )
}

