import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { messages, context } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Mesajlar gereklidir.' })
  }

  try {
    const systemPrompt = `Sen Peransa Estetik kliniğinin AI asistanısın. Türkçe konuş. Kısa, profesyonel ve sıcak bir ton kullan.

KLİNİK BİLGİLERİ:
${context || 'Klinik verisi yok.'}

Mesaj şablonları oluştururken hasta adlarını, hizmetleri ve tutarları gerçek verilerden al. Emoji kullanabilirsin ama abartma. Randevu hatırlatmaları, ödeme takibi, hasta iletişimi konularında uzmansin.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Claude API error:', data)
      return res.status(500).json({ error: 'AI yanıt vermedi, lütfen tekrar deneyin.' })
    }

    const reply = data.content?.[0]?.text || 'Yanıt alınamadı.'
    return res.status(200).json({ reply })
  } catch (err) {
    console.error('AI route error:', err)
    return res.status(500).json({ error: 'Sunucu hatası.' })
  }
}
