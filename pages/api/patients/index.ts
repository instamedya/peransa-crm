import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireAuth(req, res)
  if (!user) return

  const db = supabaseAdmin()

  // GET — list all patients
  if (req.method === 'GET') {
    const { data, error } = await db
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ data })
  }

  // POST — create patient
  if (req.method === 'POST') {
    const { first_name, last_name, phone, email, birth_date, services, total_fee, paid_fee, notes, status, photo_url } = req.body

    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'Ad ve soyad zorunludur.' })
    }

    const { data, error } = await db
      .from('patients')
      .insert([{ first_name, last_name, phone, email, birth_date, services: services || [], total_fee: total_fee || 0, paid_fee: paid_fee || 0, notes: notes || '', status: status || 'aktif', photo_url }])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
