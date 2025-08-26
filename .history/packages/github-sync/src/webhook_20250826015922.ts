import type { FastifyInstance } from 'fastify'
import crypto from 'node:crypto'
import { syncRepo } from './index.js'

function verifySignature(secret: string, payload: string, signature?: string) {
  if (!secret) return true
  const hmac = crypto.createHmac('sha256', secret)
  const digest = 'sha256=' + hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature || ''))
}

export async function registerWebhook(app: FastifyInstance) {
  app.addHook('preHandler', async (req, reply) => {
    // Accept raw payload for signature
    // Fastify raw-body plugin could be added; here we reconstruct basic body
  })
  app.post('/webhook/github', async (req, reply) => {
    const secret = process.env.WEBHOOK_SECRET || ''
    const sig = (req.headers['x-hub-signature-256'] as string) || ''
    const payload = JSON.stringify(req.body || {})
    if (!verifySignature(secret, payload, sig)) return reply.code(401).send({ error: 'bad signature' })

    const event = req.headers['x-github-event']
    if (event !== 'push') return { ok: true }

    const owner = process.env.GH_OWNER
    const repo = process.env.GH_REPO
    if (!owner || !repo) return reply.code(400).send({ error: 'missing GH_OWNER/GH_REPO' })

    await syncRepo(owner, repo, process.env.GITHUB_TOKEN)
    return { ok: true }
  })
}

