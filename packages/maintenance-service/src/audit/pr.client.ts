import fetch from 'node-fetch'
import { signServiceJWT } from '../auth/jwt'

export async function openPR(changes: Array<{ path: string, content: string }>, opts?: { branch?: string, title?: string, message?: string }) {
  const GH = process.env.GH_SYNC_URL || 'http://localhost:33031'
  const jwt = signServiceJWT({ svc: 'maintenance' })
  const res = await fetch(`${GH}/pr/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(jwt?{Authorization:`Bearer ${jwt}`}:{}) },
    body: JSON.stringify({ ...opts, changes })
  })
  if (!res.ok) throw new Error('PR create failed')
  return await res.json()
}

