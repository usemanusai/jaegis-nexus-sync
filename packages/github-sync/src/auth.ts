import type { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'

export function requireJWT(req: FastifyRequest, reply: FastifyReply, done: any) {
  const secret = process.env.GH_SYNC_JWT_SECRET
  if (!secret) return done()
  const h = String(req.headers['authorization']||'')
  const tok = h.startsWith('Bearer ') ? h.slice(7) : ''
  try {
    jwt.verify(tok, secret)
    return done()
  } catch (e) {
    reply.code(401).send({ error: 'unauthorized' })
  }
}

