import fetch from 'node-fetch'

const RAG = process.env.RAG_URL || 'http://localhost:33001'
const API_KEY = process.env.RAG_API_KEY
const headers = () => ({ 'Content-Type': 'application/json', ...(API_KEY?{ 'x-api-key': API_KEY }:{}) })

export async function ingestDoc(source: string, content: string) {
  const r = await fetch(`${RAG}/api/v1/ingest`, { method:'POST', headers: headers(), body: JSON.stringify({ source, content }) })
  if (!r.ok) return { ok: false }
  return await r.json()
}

