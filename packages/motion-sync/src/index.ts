import 'dotenv/config'
import fetch from 'node-fetch'

const RAG_INGEST = process.env.RAG_INGEST_URL || 'http://localhost:33001/api/v1/ingest'
const MOTION_API = process.env.MOTION_API || ''
const API_KEY = process.env.RAG_API_KEY

function headers() { return { 'Content-Type': 'application/json', ...(API_KEY ? { 'x-api-key': API_KEY } : {}) } }

async function fetchTasks() {
  if (!MOTION_API) return []
  // Placeholder: call Motion API; here assume it returns tasks [{id,title,notes,dueDate}]
  const res = await fetch(MOTION_API)
  if (!res.ok) return []
  const json = await res.json() as Array<any>
  return json
}

async function ingestTask(t: any) {
  const content = `Task: ${t.title}\nDue: ${t.dueDate||'n/a'}\nNotes:\n${t.notes||''}`
  const body = { source: `motion://${t.id}`, content }
  await fetch(RAG_INGEST, { method: 'POST', headers: headers(), body: JSON.stringify(body) })
}

export async function runOnce() {
  const tasks = await fetchTasks()
  for (const t of tasks) await ingestTask(t)
}

if (require.main === module) {
  runOnce().then(()=>console.log('Motion sync done')).catch((e)=>{ console.error('Motion sync failed', e); process.exit(1) })
}

