import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

// Bu endpoint sadece ilk kurulumda kullanılır, sonra silinmeli!
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { setup_key, password } = req.body

  // Güvenlik kontrolü
  if (setup_key !== process.env.JWT_SECRET) {
    return res.status(403).json({ error: 'Yetkisiz erişim.' })
  }

  try {
    const hash = await bcrypt.hash(password || 'peransa2026', 10)
    const db = supabaseAdmin()

    const { data, error } = await db
      .from('users')
      .upsert([{
        username: 'Sanaz',
        password_hash: hash,
        display_name: 'Sanaz Asadi',
        role: 'admin'
      }], { onConflict: 'username' })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({
      ok: true,
      message: 'Admin kullanıcısı oluşturuldu. Bu endpoint\'i artık silebilirsiniz.',
      username: 'Sanaz'
    })
  } catch (err) {
    return res.status(500).json({ error: 'Hata: ' + err })
  }
}
