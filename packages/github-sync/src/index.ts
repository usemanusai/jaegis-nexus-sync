import 'dotenv/config'
import { Octokit } from 'octokit'
import fetch from 'node-fetch'

const RAG_INGEST = process.env.RAG_INGEST_URL || 'http://localhost:33001/api/v1/ingest'
function authHeaders(){
  const headers: Record<string,string> = { 'Content-Type': 'application/json' }
  const key = process.env.RAG_API_KEY
  if (key) headers['x-api-key'] = key
  return headers
}

function isAllowedPath(path: string) {
  const allow = [
    '.ts','.tsx','.js','.mjs','.cjs','.json','.md','.py','.go','.rs','.java','.kt','.cs','.rb','.php','.yml','.yaml','.toml','.ini','.sh','.ps1','.gradle','.xml'
  ]
  return allow.some(ext => path.toLowerCase().endsWith(ext))
}

async function fetchRepoFiles(owner: string, repo: string, token?: string) {
  const octokit = new Octokit({ auth: token })
  const { data: trees } = await octokit.rest.git.getTree({ owner, repo, tree_sha: 'HEAD', recursive: 'true' as any })
  const files = trees.tree?.filter((t: any) => t.type === 'blob' && isAllowedPath(t.path!)) || []
  const results: Array<{ path: string, content: string }> = []
  for (const f of files) {
    const { data: blob } = await octokit.rest.git.getBlob({ owner, repo, file_sha: f.sha })
    const buf = Buffer.from(blob.content, 'base64')
    // Skip potential binaries by heuristics: if many nulls
    const text = buf.toString('utf8')
    if ((buf.match?.(/\x00/g) || []).length > 0) continue
    results.push({ path: f.path!, content: text })
  }
  return results
}

import { generateBlueprint } from './blueprint.js'

export async function syncRepo(owner: string, repo: string, token?: string) {
  const files = await fetchRepoFiles(owner, repo, token)
  // Send blueprint first
  const blueprint = generateBlueprint(files)
  await fetch(RAG_INGEST, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ source: `github://${owner}/${repo}/__blueprint.md`, content: blueprint }) })
  // Send files
  for (const f of files) {
    const body = {
      source: `github://${owner}/${repo}/${f.path}`,
      content: f.content.slice(0, 20000),
    }
    await fetch(RAG_INGEST, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) })
  }
}

if (require.main === module) {
  const [owner, repo] = process.argv.slice(2)
  if (!owner || !repo) {
    console.error('Usage: node dist/index.js <owner> <repo>')
    process.exit(1)
  }
  syncRepo(owner, repo, process.env.GITHUB_TOKEN).then(()=>{
    console.log('Sync complete')
  }).catch((e)=>{
    console.error('Sync failed', e)
    process.exit(1)
  })
}

