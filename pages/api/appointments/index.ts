import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireAuth(req, res)
  if (!user) return

  const db = supabaseAdmin()

  if (req.method === 'GET') {
    const { data, error } = await db
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ data })
  }

  if (req.method === 'POST') {
    const { patient_id, patient_name, service, date, time, note, status } = req.body

    if (!patient_name || !service || !date || !time) {
      return res.status(400).json({ error: 'Hasta, hizmet, tarih ve saat zorunludur.' })
    }

    const { data, error } = await db
      .from('appointments')
      .insert([{ patient_id: patient_id || null, patient_name, service, date, time, note: note || '', status: status || 'bekliyor' }])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
