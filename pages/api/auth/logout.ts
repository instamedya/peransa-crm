import type { NextApiRequest, NextApiResponse } from 'next'
import { clearAuthCookie, getAuthUser } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    clearAuthCookie(res)
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'GET') {
    const user = getAuthUser(req)
    if (!user) return res.status(401).json({ error: 'Oturum yok.' })
    return res.status(200).json({ user })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
