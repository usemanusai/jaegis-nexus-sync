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
    <div className="min-h-screen text-white grid grid-cols-[240px_1fr]">
      <aside className="bg-black/40 p-4">
        <h2 className="font-bold mb-3">NexusSync</h2>
        <nav className="space-y-1 text-sm">
          <div className="opacity-70">Research</div>
          <div className="opacity-50">RAG Explorer (coming)</div>
          <a href="#maintenance" className="opacity-70 block">Maintenance</a>
        </nav>
      </aside>
      <main className="bg-neutral-900 p-6">
        <h1 className="text-2xl font-bold mb-4">Research</h1>
        <form onSubmit={startResearch} className="flex gap-2">
          <input value={url} onChange={(e)=>setUrl(e.target.value)} className="px-2 py-2 rounded text-black w-[32rem]" placeholder="https://..." />
          <button className="bg-blue-600 px-4 py-2 rounded">Start</button>
        </form>

        {job && (
          <div className="mt-4 flex items-center gap-3">
            <div className="text-sm opacity-80">Job: {job}</div>
            <button onClick={pollStatus} className="bg-slate-700 px-3 py-1 rounded">Poll Status</button>
          </div>
        )}

        {status && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Result</h3>
            <pre className="bg-black/40 p-4 rounded text-sm overflow-auto max-h-[50vh]">{JSON.stringify(status, null, 2)}</pre>
          </div>
        )}

        {location.hash === '#maintenance' && (
          <div className="mt-8">
            {/* @ts-ignore */}
            <Maintenance />
          </div>
        )}
      </main>
    </div>
  )
}

