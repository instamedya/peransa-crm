import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireAuth(req, res)
  if (!user) return

  const db = supabaseAdmin()

  if (req.method === 'GET') {
    const { data, error } = await db
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ data })
  }

  if (req.method === 'POST') {
    const { patient_id, patient_name, type, amount, date, description } = req.body

    if (!type || !amount || !date) {
      return res.status(400).json({ error: 'Tür, tutar ve tarih zorunludur.' })
    }

    // If it's a tahsilat for a patient, update patient's paid_fee
    const { data, error } = await db
      .from('transactions')
      .insert([{
        patient_id: patient_id || null,
        patient_name: patient_name || '-',
        type,
        amount: Number(amount),
        date,
        description: description || ''
      }])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    // Update patient paid_fee if tahsilat
    if (type === 'tahsilat' && patient_id) {
      const { data: patient } = await db.from('patients').select('paid_fee').eq('id', patient_id).single()
      if (patient) {
        await db.from('patients').update({ paid_fee: patient.paid_fee + Number(amount) }).eq('id', patient_id)
      }
    }

    return res.status(201).json({ data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
