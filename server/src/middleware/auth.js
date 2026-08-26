import crypto from 'node:crypto'

// Deliberately minimal: one admin login (ADMIN_USERNAME/ADMIN_PASSWORD env
// vars), no real user accounts/roles yet — there's exactly one admin
// persona today, matching the actual scope asked for ("o admin faz
// upload").
//
// Stateless, signed tokens (not an in-memory session store): the token IS
// `payload.signature`, where signature = HMAC-SHA256(payload, SECRET).
// Any request carrying a validly-signed, non-expired token is accepted —
// nothing is looked up server-side, so a server restart (deploy, crash,
// or — as found during dev on this machine — `node --watch` restarting
// for reasons that traced back to file-watching quirks having nothing to
// do with an actual admin request) never silently logs an admin out
// mid-session. SECRET must stay the same across restarts (from .env) —
// if it's ever rotated, every previously-issued token stops verifying,
// which is the intended way to force a global logout.
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000 // 12h
const SECRET = process.env.ADMIN_TOKEN_SECRET

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
}

export function createSession() {
  const payload = `${Date.now() + TOKEN_TTL_MS}`
  return `${payload}.${sign(payload)}`
}

function isValid(token) {
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false
  // timingSafeEqual needs equal-length buffers, and a mismatched length
  // (e.g. a garbage/truncated token) would otherwise throw instead of
  // just failing verification.
  const expected = sign(payload)
  if (expected.length !== signature.length) return false
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return false
  return Date.now() < Number(payload)
}

export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token || !isValid(token)) {
    return res.status(401).json({ error: 'Não autenticado' })
  }
  next()
}
