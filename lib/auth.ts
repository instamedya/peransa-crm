import jwt from 'jsonwebtoken'
import { serialize, parse } from 'cookie'
import type { NextApiRequest, NextApiResponse } from 'next'

const JWT_SECRET = process.env.JWT_SECRET || 'peransa-fallback-secret'
const COOKIE_NAME = 'peransa_token'

export interface JWTPayload {
  userId: string
  username: string
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export function setAuthCookie(res: NextApiResponse, token: string) {
  res.setHeader('Set-Cookie', serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  }))
}

export function clearAuthCookie(res: NextApiResponse) {
  res.setHeader('Set-Cookie', serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  }))
}

export function getAuthUser(req: NextApiRequest): JWTPayload | null {
  const cookies = parse(req.headers.cookie || '')
  const token = cookies[COOKIE_NAME]
  if (!token) return null
  return verifyToken(token)
}

export function requireAuth(req: NextApiRequest, res: NextApiResponse): JWTPayload | null {
  const user = getAuthUser(req)
  if (!user) {
    res.status(401).json({ error: 'Oturum açmanız gerekiyor.' })
    return null
  }
  return user
}
