import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireAuth(req, res)
  if (!user) return

  const db = supabaseAdmin()
  const { id } = req.query

  // PUT — update patient
  if (req.method === 'PUT') {
    const { first_name, last_name, phone, email, birth_date, services, total_fee, paid_fee, notes, status, photo_url } = req.body

    const { data, error } = await db
      .from('patients')
      .update({ first_name, last_name, phone, email, birth_date: birth_date || null, services, total_fee, paid_fee, notes, status, photo_url: photo_url || null })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ data })
  }

  // DELETE — delete patient
  if (req.method === 'DELETE') {
    const { error } = await db.from('patients').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
