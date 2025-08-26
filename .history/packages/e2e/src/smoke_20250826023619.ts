import fetch from 'node-fetch'

const RAG = process.env.RAG_URL || 'http://localhost:33001'

async function sleep(ms:number){ return new Promise(r=>setTimeout(r,ms)) }

async function run() {
  const ingest = await fetch(`${RAG}/api/v1/ingest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: 'test://smoke', content: 'hello e2e world' }) })
  if (!ingest.ok) throw new Error('ingest failed')
  await sleep(800)
  const query = await fetch(`${RAG}/api/v1/query`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: 'e2e world' }) })
  if (!query.ok) throw new Error('query failed')
  const data = await query.json()
  if (!Array.isArray(data.results)) throw new Error('bad results')
  console.log('OK', data.results[0])
}

run().catch((e)=>{ console.error(e); process.exit(1) })

