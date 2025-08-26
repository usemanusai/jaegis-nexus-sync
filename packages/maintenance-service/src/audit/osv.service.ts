import { Injectable } from '@nestjs/common'
import fetch from 'node-fetch'

interface OSVQueryReq { package: { name: string, ecosystem: string }, version?: string }
interface OSVAdvisory { id: string, summary?: string, severity?: { type: string, score: string }[], references?: { type: string, url: string }[] }

@Injectable()
export class OsvService {
  private base = 'https://api.osv.dev/v1/query'

  async query(ecosystem: string, name: string, version?: string): Promise<OSVAdvisory[]> {
    const body: OSVQueryReq = { package: { name, ecosystem } }
    if (version) body.version = version
    const res = await fetch(this.base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) return []
    const json: any = await res.json()
    return json.vulns || []
  }
}

