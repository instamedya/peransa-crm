import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { signToken, setAuthCookie } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre gereklidir.' })
  }

  try {
    const db = supabaseAdmin()
    const { data: user, error } = await db
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !user) {
      console.error('User lookup error:', JSON.stringify(error))
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.', debug: error?.message })
    }

    console.log('Found user:', user.username, 'Hash prefix:', user.password_hash?.substring(0, 10))
    const valid = await bcrypt.compare(password, user.password_hash)
    console.log('Password valid:', valid)
    if (!valid) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.', debug: 'password_mismatch' })
    }

    const token = signToken({ userId: user.id, username: user.username })
    setAuthCookie(res, token)

    return res.status(200).json({
      user: { id: user.id, username: user.username, display_name: user.display_name, role: user.role }
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Sunucu hatası.' })
  }
}
