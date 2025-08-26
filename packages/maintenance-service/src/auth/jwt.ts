import jwt from 'jsonwebtoken'

export function signServiceJWT(payload: any = {}) {
  const secret = process.env.GH_SYNC_JWT_SECRET || ''
  if (!secret) return ''
  return jwt.sign(payload, secret, { expiresIn: '10m' })
}

