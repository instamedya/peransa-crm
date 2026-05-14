import type { NextApiRequest, NextApiResponse } from 'next'
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

    // Geçici: bcrypt yerine direkt karşılaştırma veya sabit şifre
    // Sonra bcrypt'e döneceğiz
    let valid = false
    
    // Önce plain text dene
    if (user.password_hash === password) {
      valid = true
    }
    
    // Sonra bcrypt dene
    if (!valid) {
      try {
        const bcrypt = require('bcryptjs')
        valid = await bcrypt.compare(password, user.password_hash)
      } catch(e) {
        console.error('bcrypt error:', e)
      }
    }

    console.log('Password valid:', valid, 'Hash starts:', user.password_hash?.substring(0, 15))
    
    if (!valid) {
      return res.status(401).json({ 
        error: 'Kullanıcı adı veya şifre hatalı.', 
        debug: 'password_mismatch',
        hash_prefix: user.password_hash?.substring(0, 15)
      })
    }

    const token = signToken({ userId: user.id, username: user.username })
    setAuthCookie(res, token)

    return res.status(200).json({
      user: { id: user.id, username: user.username, display_name: user.display_name, role: user.role }
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Sunucu hatası.', debug: String(err) })
  }
}
