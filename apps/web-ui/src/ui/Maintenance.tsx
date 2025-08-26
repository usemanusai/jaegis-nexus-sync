import React, { useEffect, useState } from 'react'

const MS = import.meta.env.VITE_MAINTENANCE_URL || 'http://localhost:33041'

export default function Maintenance() {
  const [status, setStatus] = useState<any>(null)
  const [deps, setDeps] = useState<any[]>([])

  async function fetchStatus(){
    const r = await fetch(`${MS}/api/v1/audit/status`)
    setStatus(await r.json())
  }
  async function runNow(){
    await fetch(`${MS}/api/v1/audit/run`, { method:'POST' })
    fetchStatus(); fetchDeps()
  }
  async function fetchDeps(){
    const r = await fetch(`${MS}/api/v1/deps?vulnerableOnly=true&limit=50`)
    setDeps(await r.json())
  }
  useEffect(()=>{ fetchStatus(); fetchDeps() },[])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Maintenance</h2>
        <button onClick={runNow} className="bg-blue-600 px-3 py-1 rounded">Run Audit Now</button>
      </div>
      <div className="text-sm opacity-80">Last Run: {status?.lastRun || 'n/a'}</div>
      {status?.lastPR?.url && (
        <div className="text-sm">Last PR: <a href={status.lastPR.url} className="underline text-blue-400" target="_blank">#{status.lastPR.number}</a></div>
      )}
      <div className="mt-2">
        <h3 className="font-semibold mb-2">Top Vulnerable Dependencies</h3>
        <div className="grid grid-cols-1 gap-2">
          {deps.map((d,i)=> (
            <div key={i} className="bg-black/30 rounded p-2 flex justify-between">
              <div>
                <div className="font-mono">{d.name} <span className="opacity-70">[{d.ecosystem}]</span></div>
                <div className="text-xs opacity-70">version {d.currentVersion}</div>
              </div>
              <div className="text-right">
                <div className="text-sm">Vulns: {d.vulnerabilityCount}</div>
                <div className="text-xs opacity-70">Top Severity: {d.topSeverity||'n/a'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

