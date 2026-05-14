import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import type { Patient, Appointment, Transaction } from '@/types'

// ── WhatsApp helper
function waLink(phone: string) {
  const digits = phone.replace(/\D/g, '')
  const intl = digits.startsWith('0') ? '90' + digits.slice(1) : digits
  return `https://wa.me/${intl}`
}

// ── Logo (inline SVG representation of Peransa brand colors)
const LOGO_TEXT = () => (
  <div style={{ background: '#fff', borderRadius: 10, padding: '7px 12px', display: 'inline-block' }}>
    <div style={{ fontSize: 18, fontWeight: 800, color: '#2B3A6B', letterSpacing: '-0.02em', lineHeight: 1 }}>
      Peransa
    </div>
    <div style={{ fontSize: 9, fontWeight: 700, color: '#B8960C', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 1 }}>
      Estetik
    </div>
  </div>
)

// ── Colors
const C = {
  bg: '#F0F2F7', card: '#FFFFFF',
  gold: '#B8960C', goldLight: '#D4AE3A', goldDark: '#8A6E00', goldBg: '#FBF6E9',
  dark: '#1B2A52', navy: '#243569', mid: '#374E8E', muted: '#8090B8', faint: '#C2CCDF',
  border: '#E2E8F4', borderDark: '#C8D2E8',
  success: '#1A5C42', successBg: '#E8F5EE',
  danger: '#8B1A1A', dangerBg: '#FDEAEA',
  warn: '#6B4A00', warnBg: '#FEF6E4',
  info: '#1A3A6B', infoBg: '#E8EEFA',
}

const SERVICES = [
  'Burun Küçültme', 'Burun Şekillendirme', 'Burun Küçültme + Şekillendirme',
  'Dolgu Uygulaması', 'Botoks', 'PRP', 'Yüz Germe', 'Göz Kapağı Estetiği',
]

const TIMES = ['00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30']

const QUICK_PROMPTS = [
  'Ödeme bekleyen hastaları listele ve hatırlatma mesajı yaz',
  'Bu haftaki randevular için hazırlık notları çıkar',
  'Yeni hasta için karşılama mesajı hazırla',
  'Randevu hatırlatma mesajı yaz',
  'Seans sonrası bakım talimatları hazırla',
]

// ── Badge component
function Badge({ type }: { type: string }) {
  const map: Record<string, { bg: string; c: string }> = {
    aktif:      { bg: C.infoBg,    c: C.info },
    tamamlandı: { bg: C.successBg, c: C.success },
    bekliyor:   { bg: C.warnBg,    c: C.warn },
    iptal:      { bg: C.dangerBg,  c: C.danger },
    tahsilat:   { bg: C.successBg, c: C.success },
    gider:      { bg: C.dangerBg,  c: C.danger },
  }
  const s = map[type] || { bg: '#F0F2F7', c: C.muted }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
      borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
      textTransform: 'uppercase', background: s.bg, color: s.c }}>
      {type}
    </span>
  )
}

// ── Avatar
function Avatar({ patient, size = 40 }: { patient: Partial<Patient>; size?: number }) {
  const initials = `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`
  if (patient.photo_url) {
    return <img src={patient.photo_url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.border}` }} />
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: C.infoBg,
      border: `2px solid ${C.border}`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: C.navy, fontWeight: 700, fontSize: size * 0.35, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

// ── WaButton
function WaButton({ phone }: { phone: string }) {
  if (!phone) return null
  return (
    <a href={waLink(phone)} target="_blank" rel="noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px',
        background: '#25D366', color: '#fff', borderRadius: 20, fontSize: 11.5,
        fontWeight: 700, textDecoration: 'none' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.122 1.532 5.857L.057 23.882a.5.5 0 00.611.611l6.025-1.475A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.812 9.812 0 01-5.003-1.368l-.358-.213-3.718.91.929-3.618-.234-.372A9.818 9.818 0 012.182 12C2.182 6.573 6.573 2.182 12 2.182S21.818 6.573 21.818 12 17.427 21.818 12 21.818z"/>
      </svg>
      WhatsApp
    </a>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!username || !password) { setError('Lütfen tüm alanları doldurun.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Giriş başarısız.'); return }
      onLogin()
    } catch { setError('Bağlantı hatası.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #111D3C 0%, #1B2A52 45%, #243569 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 16, padding: '40px 36px',
        border: '1px solid #E2E8F4', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <LOGO_TEXT />
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 10 }}>
            CRM Yönetim Sistemi
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 10.5, color: C.muted, letterSpacing: '0.09em', textTransform: 'uppercase', display: 'block', marginBottom: 5, fontWeight: 600 }}>
            Kullanıcı Adı
          </label>
          <input style={{ width: '100%', padding: '10px 13px', border: `1.5px solid ${C.border}`, borderRadius: 8,
            fontSize: 14, fontFamily: 'inherit', color: C.dark, outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
            value={username} onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="Kullanıcı adınız" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 10.5, color: C.muted, letterSpacing: '0.09em', textTransform: 'uppercase', display: 'block', marginBottom: 5, fontWeight: 600 }}>
            Şifre
          </label>
          <input type="password" style={{ width: '100%', padding: '10px 13px', border: `1.5px solid ${C.border}`, borderRadius: 8,
            fontSize: 14, fontFamily: 'inherit', color: C.dark, outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••" />
        </div>
        {error && <div style={{ color: C.danger, fontSize: 12, marginBottom: 14, textAlign: 'center' }}>{error}</div>}
        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', padding: '12px', background: C.dark, color: '#fff', border: 'none',
            borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [tab, setTab] = useState('dashboard')
  const [isMobile, setIsMobile] = useState(false)
  const [sideOpen, setSideOpen] = useState(false)

  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  // Modals
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null)
  const [showApptForm, setShowApptForm] = useState(false)
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null)
  const [showTxForm, setShowTxForm] = useState(false)

  // Forms
  const emptyPatient = { first_name: '', last_name: '', phone: '', email: '', birth_date: '', services: [] as string[], total_fee: 0, paid_fee: 0, notes: '', status: 'aktif' as const, photo_url: '' }
  const emptyAppt = { patient_id: '', patient_name: '', service: '', date: '', time: '10:00', note: '', status: 'bekliyor' as const }
  const emptyTx = { patient_id: '', patient_name: '', type: 'tahsilat' as const, amount: 0, date: new Date().toISOString().split('T')[0], description: '' }
  const [pForm, setPForm] = useState(emptyPatient)
  const [aForm, setAForm] = useState(emptyAppt)
  const [tForm, setTForm] = useState(emptyTx)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Chat
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Merhaba Sanaz! Ben Peransa Estetik AI asistanınızım. 👋\n\nHasta mesajları, randevu hatırlatmaları, ödeme takibi konularında yardımcı olabilirim.' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  // ── Check auth on mount
  useEffect(() => {
    fetch('/api/auth/logout')
      .then(r => r.json())
      .then(d => { if (d.user) setLoggedIn(true) })
      .catch(() => {})
      .finally(() => setCheckingAuth(false))
  }, [])

  // ── Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Load data
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, aRes, tRes] = await Promise.all([
        fetch('/api/patients').then(r => r.json()),
        fetch('/api/appointments').then(r => r.json()),
        fetch('/api/transactions').then(r => r.json()),
      ])
      if (pRes.data) setPatients(pRes.data)
      if (aRes.data) setAppointments(aRes.data)
      if (tRes.data) setTransactions(tRes.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { if (loggedIn) loadData() }, [loggedIn, loadData])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setLoggedIn(false)
  }

  // ── Patient CRUD
  async function savePatient() {
    if (!pForm.first_name || !pForm.last_name) { setFormError('Ad ve soyad zorunludur.'); return }
    setSaving(true); setFormError('')
    try {
      const url = editingPatient ? `/api/patients/${editingPatient.id}` : '/api/patients'
      const method = editingPatient ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pForm) })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || 'Hata oluştu.'); return }
      await loadData()
      setShowPatientForm(false)
      setEditingPatient(null)
      setPForm(emptyPatient)
    } catch { setFormError('Bağlantı hatası.') }
    setSaving(false)
  }

  async function deletePatient(id: string) {
    if (!confirm('Bu hastayı silmek istediğinizden emin misiniz?')) return
    await fetch(`/api/patients/${id}`, { method: 'DELETE' })
    await loadData()
    setViewingPatient(null)
  }

  // ── Appointment CRUD
  async function saveAppt() {
    if (!aForm.patient_name || !aForm.service || !aForm.date) { setFormError('Zorunlu alanları doldurun.'); return }
    setSaving(true); setFormError('')
    try {
      const url = editingAppt ? `/api/appointments/${editingAppt.id}` : '/api/appointments'
      const method = editingAppt ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(aForm) })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || 'Hata oluştu.'); return }
      await loadData()
      setShowApptForm(false)
      setEditingAppt(null)
      setAForm(emptyAppt)
    } catch { setFormError('Bağlantı hatası.') }
    setSaving(false)
  }

  async function updateApptStatus(id: string, status: string) {
    await fetch(`/api/appointments/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: status as Appointment['status'] } : a))
  }

  // ── Transaction
  async function saveTx() {
    if (!tForm.amount || !tForm.date) { setFormError('Tutar ve tarih zorunludur.'); return }
    setSaving(true); setFormError('')
    try {
      const res = await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tForm) })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || 'Hata oluştu.'); return }
      await loadData()
      setShowTxForm(false)
      setTForm(emptyTx)
    } catch { setFormError('Bağlantı hatası.') }
    setSaving(false)
  }

  // ── Photo upload
  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPForm(p => ({ ...p, photo_url: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  // ── AI Chat
  async function sendChat(text?: string) {
    const msg = text || chatInput.trim()
    if (!msg || chatLoading) return
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', text: msg }])
    setChatLoading(true)
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    const unpaid = patients.filter(p => p.total_fee - p.paid_fee > 0)
    const context = `Toplam hasta: ${patients.length} | Ödeme bekleyen: ${unpaid.length} (₺${unpaid.reduce((s, p) => s + (p.total_fee - p.paid_fee), 0).toLocaleString()})
Hastalar: ${patients.map(p => `${p.first_name} ${p.last_name} | Tel: ${p.phone} | Kalan: ₺${p.total_fee - p.paid_fee}`).join(' | ')}`

    try {
      const history = chatMessages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }))
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...history, { role: 'user', content: msg }], context }),
      })
      const data = await res.json()
      setChatMessages(prev => [...prev, { role: 'assistant', text: data.reply || 'Yanıt alınamadı.' }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Bağlantı hatası oluştu.' }])
    }
    setChatLoading(false)
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  // ── Computed values
  const today = new Date().toISOString().split('T')[0]
  const todayAppts = appointments.filter(a => a.date === today)
  const totalCollected = transactions.filter(t => t.type === 'tahsilat').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'gider').reduce((s, t) => s + t.amount, 0)
  const totalReceivable = patients.reduce((s, p) => s + (p.total_fee - p.paid_fee), 0)
  const filteredPatients = patients.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search)
  )

  const navItems = [
    { id: 'dashboard', label: isMobile ? 'Panel' : 'Genel Bakış', icon: '◈' },
    { id: 'patients',  label: isMobile ? 'Hastalar' : 'Hasta Kayıtları', icon: '◎' },
    { id: 'appointments', label: isMobile ? 'Randevu' : 'Randevu Takibi', icon: '◷' },
    { id: 'accounting', label: isMobile ? 'Cari' : 'Cari Hesap', icon: '₺' },
    { id: 'chatbot', label: 'AI', icon: '✦' },
  ]

  // ── Shared styles
  const cardStyle = { background: C.card, borderRadius: 12, boxShadow: '0 1px 3px rgba(27,42,82,0.06), 0 4px 16px rgba(27,42,82,0.04)', border: `1px solid ${C.border}`, overflow: 'hidden' }
  const inputStyle = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit', color: C.dark, outline: 'none', boxSizing: 'border-box' as const, background: '#FAFBFD' }
  const selectStyle = { ...inputStyle, background: '#FAFBFD' }
  const labelStyle = { fontSize: 10.5, color: C.muted, letterSpacing: '0.09em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5, fontWeight: 600 }
  const btnStyle = { background: C.dark, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }
  const btnSmStyle = { background: C.dark, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }
  const btnOutlineStyle = { background: 'transparent', color: C.dark, border: `1.5px solid ${C.borderDark}`, borderRadius: 8, padding: '8px 18px', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1B2A52', fontFamily: 'inherit' }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Yükleniyor...</div>
      </div>
    )
  }

  if (!loggedIn) return <LoginPage onLogin={() => { setLoggedIn(true) }} />

  return (
    <>
      <Head>
        <title>Peransa Estetik CRM</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh', background: C.bg, display: 'flex', position: 'relative' }}>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          ::-webkit-scrollbar { width: 4px; height: 4px; }
          ::-webkit-scrollbar-thumb { background: ${C.faint}; border-radius: 10px; }
          input:focus, select:focus, textarea:focus { border-color: ${C.dark} !important; box-shadow: 0 0 0 3px rgba(27,42,82,0.08) !important; }
          @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
          tr:hover td { background: #F5F7FC; }
        `}</style>

        {/* ── Mobile Header */}
        {isMobile && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, height: 54,
            background: '#111D3C', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
            <LOGO_TEXT />
            <button onClick={() => setSideOpen(v => !v)}
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8,
                width: 36, height: 36, cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              {[0,1,2].map(i => <span key={i} style={{ width: 18, height: 2, background: '#fff', borderRadius: 2, display: 'block' }} />)}
            </button>
          </div>
        )}

        {/* ── Sidebar backdrop */}
        {isMobile && sideOpen && (
          <div onClick={() => setSideOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 299, animation: 'fadeIn 0.2s' }} />
        )}

        {/* ── Sidebar */}
        <div style={{
          width: 248, minHeight: '100vh', flexShrink: 0,
          background: '#111D3C', borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
          ...(isMobile ? {
            position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 300, width: 260,
            transform: sideOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.28s cubic-bezier(.4,0,.2,1)',
          } : {}),
        }}>
          <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 4 }}>
            <LOGO_TEXT />
            <div style={{ marginTop: 12 }}>
              <div style={{ color: '#fff', fontSize: 13.5, fontWeight: 700 }}>Sanaz Asadi</div>
              <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 10, marginTop: 2, letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 500 }}>Yönetim Paneli</div>
            </div>
          </div>

          <div style={{ paddingTop: 8 }}>
            {navItems.map(item => {
              const active = tab === item.id
              return (
                <div key={item.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 20px',
                    cursor: 'pointer', margin: '1px 8px', borderRadius: 8,
                    color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                    background: active ? 'rgba(184,150,12,0.18)' : 'transparent',
                    borderLeft: `2px solid ${active ? C.gold : 'transparent'}`,
                    fontSize: 13, fontWeight: active ? 600 : 400 }}
                  onClick={() => { setTab(item.id); setSideOpen(false) }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                    background: active ? 'rgba(184,150,12,0.22)' : 'rgba(255,255,255,0.07)',
                    color: active ? C.goldLight : 'rgba(255,255,255,0.45)', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </div>
              )
            })}
          </div>

          <div style={{ flex: 1 }} />
          <div style={{ margin: 'auto 12px 18px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: C.gold, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Giriş Yapan</div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginTop: 3 }}>Sanaz</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Sistem Yöneticisi</div>
            <button onClick={handleLogout}
              style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
              Çıkış Yap →
            </button>
          </div>
        </div>

        {/* ── Main Content */}
        <div style={{ flex: 1, padding: isMobile ? '70px 16px 80px' : '28px 32px', overflow: 'auto' }}>

          {/* ══ DASHBOARD ══ */}
          {tab === 'dashboard' && (
            <>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', marginBottom: 24, gap: isMobile ? 12 : 0 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: C.dark, letterSpacing: '-0.02em' }}>Hoş Geldiniz, Sanaz 🌿</div>
                  <div style={{ fontSize: 12.5, color: C.muted, marginTop: 5 }}>Bugün {todayAppts.length} randevunuz var</div>
                </div>
                <button style={btnStyle} onClick={() => { setPForm(emptyPatient); setEditingPatient(null); setShowPatientForm(true) }}>+ Yeni Hasta</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { lbl: 'Toplam Hasta', val: patients.length, accent: C.gold },
                  { lbl: 'Bugün Randevu', val: todayAppts.length, accent: C.navy },
                  { lbl: 'Tahsilat', val: `₺${totalCollected.toLocaleString()}`, accent: C.success },
                  { lbl: 'Bekleyen', val: `₺${totalReceivable.toLocaleString()}`, accent: C.danger },
                ].map((s, i) => (
                  <div key={i} style={{ background: C.card, borderRadius: 12, padding: '18px 20px', borderLeft: `3px solid ${s.accent}`, boxShadow: '0 1px 3px rgba(27,42,82,0.06)', border: `1px solid ${C.border}`, borderLeftColor: s.accent }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: C.dark, letterSpacing: '-0.02em' }}>{s.val}</div>
                    <div style={{ fontSize: 10.5, color: C.muted, marginTop: 6, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{s.lbl}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr', gap: 16 }}>
                <div style={cardStyle}>
                  <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFBFD' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: C.dark }}>Bugünkü Randevular</span>
                    <button style={btnSmStyle} onClick={() => setTab('appointments')}>Tümü</button>
                  </div>
                  {loading ? <div style={{ padding: 20, color: C.muted, fontSize: 13 }}>Yükleniyor...</div> :
                    todayAppts.length === 0 ? <div style={{ padding: 20, color: C.muted, fontSize: 13 }}>Bugün randevu bulunmuyor.</div> :
                    todayAppts.map(a => (
                      <div key={a.id} style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: C.dark, fontSize: 14 }}>{a.patient_name}</div>
                          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{a.time} · {a.service}</div>
                        </div>
                        <Badge type={a.status} />
                      </div>
                    ))
                  }
                </div>

                <div style={cardStyle}>
                  <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFBFD' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: C.dark }}>Son Hastalar</span>
                    <button style={btnSmStyle} onClick={() => setTab('patients')}>Tümü</button>
                  </div>
                  {patients.slice(0, 4).map(p => (
                    <div key={p.id} onClick={() => setViewingPatient(p)} style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                      <Avatar patient={p} size={36} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: C.dark, fontSize: 14 }}>{p.first_name} {p.last_name}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{p.services?.join(', ')}</div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: (p.total_fee - p.paid_fee) > 0 ? C.warn : C.success }}>
                        {(p.total_fee - p.paid_fee) > 0 ? `₺${(p.total_fee - p.paid_fee).toLocaleString()}` : '✓'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ══ HASTALAR ══ */}
          {tab === 'patients' && (
            <>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', marginBottom: 20, gap: 12 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: C.dark, letterSpacing: '-0.02em' }}>Hasta Kayıtları</div>
                  <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>{patients.length} hasta kayıtlı</div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row', width: isMobile ? '100%' : 'auto' }}>
                  <input style={{ ...inputStyle, width: isMobile ? '100%' : 220, marginBottom: 0 }} placeholder="🔍 İsim veya telefon..." value={search} onChange={e => setSearch(e.target.value)} />
                  <button style={btnStyle} onClick={() => { setPForm(emptyPatient); setEditingPatient(null); setShowPatientForm(true) }}>+ Yeni Hasta</button>
                </div>
              </div>

              {isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredPatients.map(p => {
                    const kalan = p.total_fee - p.paid_fee
                    return (
                      <div key={p.id} style={{ ...cardStyle, padding: 16 }} onClick={() => setViewingPatient(p)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <Avatar patient={p} size={44} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: C.dark, fontSize: 15 }}>{p.first_name} {p.last_name}</div>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{p.services?.join(' · ')}</div>
                          </div>
                          <Badge type={p.status} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                          {[{ l: 'Toplam', v: `₺${p.total_fee.toLocaleString()}`, c: C.dark }, { l: 'Alınan', v: `₺${p.paid_fee.toLocaleString()}`, c: C.success }, { l: 'Kalan', v: `₺${kalan.toLocaleString()}`, c: kalan > 0 ? C.warn : C.success }].map((x, i) => (
                            <div key={i} style={{ background: '#F5F7FC', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: x.c }}>{x.v}</div>
                              <div style={{ fontSize: 9.5, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{x.l}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                          <WaButton phone={p.phone} />
                          <button style={btnSmStyle} onClick={() => { setPForm({ ...p, birth_date: p.birth_date || '', photo_url: p.photo_url || '' }); setEditingPatient(p); setShowPatientForm(true) }}>Düzenle</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={cardStyle}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>{['', 'Ad Soyad', 'İletişim', 'Hizmetler', 'Toplam', 'Alınan', 'Kalan', 'Durum', ''].map((h, i) => (
                        <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#F5F7FC', borderBottom: `1px solid ${C.border}`, fontWeight: 600 }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map(p => (
                        <tr key={p.id} style={{ cursor: 'pointer' }}>
                          <td style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}`, width: 48 }} onClick={() => setViewingPatient(p)}><Avatar patient={p} size={34} /></td>
                          <td style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}` }} onClick={() => setViewingPatient(p)}>
                            <div style={{ fontWeight: 700, color: C.dark }}>{p.first_name} {p.last_name}</div>
                            <div style={{ fontSize: 11, color: C.muted }}>{p.created_at?.split('T')[0]}</div>
                          </td>
                          <td style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ color: C.mid, fontSize: 13 }}>{p.phone}</span>
                              <WaButton phone={p.phone} />
                            </div>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{p.email}</div>
                          </td>
                          <td style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 12 }} onClick={() => setViewingPatient(p)}>
                            {p.services?.map(s => <div key={s}>• {s}</div>)}
                          </td>
                          <td style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 13 }} onClick={() => setViewingPatient(p)}>₺{p.total_fee.toLocaleString()}</td>
                          <td style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}`, color: C.success, fontWeight: 700, fontSize: 13 }} onClick={() => setViewingPatient(p)}>₺{p.paid_fee.toLocaleString()}</td>
                          <td style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}`, color: (p.total_fee - p.paid_fee) > 0 ? C.warn : C.success, fontWeight: 700, fontSize: 13 }} onClick={() => setViewingPatient(p)}>₺{(p.total_fee - p.paid_fee).toLocaleString()}</td>
                          <td style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}` }} onClick={() => setViewingPatient(p)}><Badge type={p.status} /></td>
                          <td style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}` }}>
                            <button style={btnSmStyle} onClick={() => { setPForm({ ...p, birth_date: p.birth_date || '', photo_url: p.photo_url || '' }); setEditingPatient(p); setShowPatientForm(true) }}>Düzenle</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ══ RANDEVULAR ══ */}
          {tab === 'appointments' && (
            <>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', marginBottom: 20, gap: 12 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: C.dark }}>Randevu Takibi</div>
                  <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>{appointments.length} toplam randevu</div>
                </div>
                <button style={btnStyle} onClick={() => { setAForm(emptyAppt); setEditingAppt(null); setShowApptForm(true) }}>+ Yeni Randevu</button>
              </div>
              <div style={cardStyle}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, background: '#FAFBFD' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: C.dark }}>Randevular</span>
                </div>
                {isMobile ? (
                  <div>
                    {[...appointments].sort((a, b) => a.date.localeCompare(b.date)).map(a => {
                      const pat = patients.find(p => p.id === a.patient_id)
                      return (
                        <div key={a.id} style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {pat && <Avatar patient={pat} size={36} />}
                              <div>
                                <div style={{ fontWeight: 700, color: C.dark, fontSize: 14 }}>{a.patient_name}</div>
                                <div style={{ fontSize: 12, color: C.muted }}>{a.service}</div>
                              </div>
                            </div>
                            <Badge type={a.status} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: 12, color: C.muted }}>📅 {a.date} · ⏰ {a.time}</div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button style={btnSmStyle} onClick={() => { setAForm({ patient_id: a.patient_id, patient_name: a.patient_name, service: a.service, date: a.date, time: a.time, note: a.note, status: a.status }); setEditingAppt(a); setShowApptForm(true) }}>Düzenle</button>
                              <select style={{ ...selectStyle, width: 'auto', padding: '4px 7px', fontSize: 11, marginBottom: 0 }} value={a.status} onChange={e => updateApptStatus(a.id, e.target.value)}>
                                <option value="bekliyor">Bekliyor</option>
                                <option value="tamamlandı">Tamamlandı</option>
                                <option value="iptal">İptal</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>{['Hasta', 'Hizmet', 'Tarih', 'Saat', 'Not', 'Durum', 'İşlem'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#F5F7FC', borderBottom: `1px solid ${C.border}`, fontWeight: 600 }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {[...appointments].sort((a, b) => a.date.localeCompare(b.date)).map(a => {
                        const pat = patients.find(p => p.id === a.patient_id)
                        return (
                          <tr key={a.id}>
                            <td style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {pat && <Avatar patient={pat} size={30} />}
                                <strong style={{ color: C.dark, fontSize: 13 }}>{a.patient_name}</strong>
                              </div>
                            </td>
                            <td style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>{a.service}</td>
                            <td style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>{a.date}</td>
                            <td style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>{a.time}</td>
                            <td style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 12, color: C.muted }}>{a.note || '—'}</td>
                            <td style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}` }}><Badge type={a.status} /></td>
                            <td style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}` }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button style={btnSmStyle} onClick={() => { setAForm({ patient_id: a.patient_id, patient_name: a.patient_name, service: a.service, date: a.date, time: a.time, note: a.note, status: a.status }); setEditingAppt(a); setShowApptForm(true) }}>Düzenle</button>
                                <select style={{ ...selectStyle, width: 'auto', padding: '4px 8px', fontSize: 11, marginBottom: 0 }} value={a.status} onChange={e => updateApptStatus(a.id, e.target.value)}>
                                  <option value="bekliyor">Bekliyor</option>
                                  <option value="tamamlandı">Tamamlandı</option>
                                  <option value="iptal">İptal</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ══ CARİ HESAP ══ */}
          {tab === 'accounting' && (
            <>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', marginBottom: 20, gap: 12 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: C.dark }}>Cari Hesap</div>
                  <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>Ön muhasebe & tahsilat takibi</div>
                </div>
                <button style={btnStyle} onClick={() => { setTForm(emptyTx); setShowTxForm(true) }}>+ Yeni İşlem</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { lbl: 'Toplam Tahsilat', val: `₺${totalCollected.toLocaleString()}`, accent: C.success },
                  { lbl: 'Toplam Gider', val: `₺${totalExpense.toLocaleString()}`, accent: C.danger },
                  { lbl: 'Net Bakiye', val: `₺${(totalCollected - totalExpense).toLocaleString()}`, accent: C.gold },
                ].map((s, i) => (
                  <div key={i} style={{ background: C.card, borderRadius: 12, padding: '18px 20px', borderLeft: `3px solid ${s.accent}`, border: `1px solid ${C.border}`, borderLeftColor: s.accent }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: s.accent, letterSpacing: '-0.02em' }}>{s.val}</div>
                    <div style={{ fontSize: 10.5, color: C.muted, marginTop: 6, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{s.lbl}</div>
                  </div>
                ))}
              </div>

              <div style={{ ...cardStyle, marginBottom: 20 }}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, background: '#FAFBFD' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: C.dark }}>Hasta Ödeme Durumları</span>
                </div>
                {patients.map(p => {
                  const kalan = p.total_fee - p.paid_fee
                  return (
                    <div key={p.id} style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar patient={p} size={34} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: C.dark, fontSize: 13.5 }}>{p.first_name} {p.last_name}</div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 3, fontSize: 12 }}>
                          <span style={{ color: C.muted }}>Toplam: ₺{p.total_fee.toLocaleString()}</span>
                          <span style={{ color: C.success }}>Alınan: ₺{p.paid_fee.toLocaleString()}</span>
                          <span style={{ color: kalan > 0 ? C.warn : C.success, fontWeight: 700 }}>Kalan: ₺{kalan.toLocaleString()}</span>
                        </div>
                      </div>
                      {kalan > 0 ? <Badge type="bekliyor" /> : <Badge type="tamamlandı" />}
                    </div>
                  )
                })}
              </div>

              <div style={cardStyle}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, background: '#FAFBFD' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: C.dark }}>İşlem Geçmişi</span>
                </div>
                {transactions.map(t => (
                  <div key={t.id} style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{t.description || '—'}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{t.date} · {t.patient_name}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Badge type={t.type} />
                      <div style={{ fontSize: 14, fontWeight: 700, color: t.type === 'tahsilat' ? C.success : C.danger }}>
                        {t.type === 'tahsilat' ? '+' : '-'}₺{t.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ══ AI ASISTAN ══ */}
          {tab === 'chatbot' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: isMobile ? 'calc(100vh - 150px)' : 'calc(100vh - 100px)' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.dark }}>AI Asistan ✦</div>
                <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>Hasta mesajları ve klinik içerikleri için yapay zeka desteği</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {QUICK_PROMPTS.map((q, i) => (
                  <button key={i} onClick={() => sendChat(q)}
                    style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: `1px solid ${C.gold}`, background: 'transparent', color: C.navy, fontFamily: 'inherit', fontWeight: 600 }}>
                    {q}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1, ...cardStyle, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {chatMessages.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 10 }}>
                      {m.role === 'assistant' && (
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${C.gold}, ${C.navy})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, flexShrink: 0, marginTop: 2 }}>✦</div>
                      )}
                      <div style={{ maxWidth: '72%', padding: '11px 15px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: m.role === 'user' ? `linear-gradient(135deg, ${C.dark}, ${C.navy})` : '#F4F6FA', color: m.role === 'user' ? '#fff' : C.dark, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {m.text}
                      </div>
                      {m.role === 'user' && (
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 2 }}>S</div>
                      )}
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${C.gold}, ${C.navy})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13 }}>✦</div>
                      <div style={{ background: '#F4F6FA', padding: '11px 15px', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: 5, alignItems: 'center' }}>
                        {[0,1,2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: C.gold, display: 'inline-block', animation: `bounce 1.2s ${i*0.2}s infinite` }} />)}
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>
                <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10, background: '#FAFBFD' }}>
                  <input style={{ ...inputStyle, flex: 1, marginBottom: 0, borderRadius: 24, padding: '10px 16px' }}
                    placeholder="Bir şey sorun veya mesaj oluşturmamı isteyin..."
                    value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChat()} disabled={chatLoading} />
                  <button style={{ ...btnStyle, borderRadius: 24, padding: '10px 20px', opacity: chatLoading ? 0.6 : 1 }}
                    onClick={() => sendChat()} disabled={chatLoading}>
                    {chatLoading ? '...' : 'Gönder ➤'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Mobile Bottom Nav */}
        {isMobile && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: '#111D3C', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', boxShadow: '0 -4px 20px rgba(0,0,0,0.25)' }}>
            {navItems.map(item => {
              const active = tab === item.id
              return (
                <div key={item.id} onClick={() => setTab(item.id)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 4px 12px', cursor: 'pointer', borderTop: `2px solid ${active ? C.gold : 'transparent'}` }}>
                  <div style={{ fontSize: 17, marginBottom: 3, color: active ? C.gold : 'rgba(255,255,255,0.35)' }}>{item.icon}</div>
                  <div style={{ fontSize: 9.5, fontWeight: active ? 700 : 400, color: active ? C.gold : 'rgba(255,255,255,0.35)' }}>{item.label}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* ══ MODALS ══ */}

        {/* Patient Form Modal */}
        {showPatientForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,25,55,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}
            onClick={() => setShowPatientForm(false)}>
            <div style={{ background: C.card, borderRadius: '16px 16px 0 0', padding: '24px 24px 32px', width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', animation: 'slideUp 0.25s ease', border: `1px solid ${C.border}` }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginBottom: 20 }}>{editingPatient ? 'Hasta Düzenle' : 'Yeni Hasta Kaydı'}</div>

              {/* Photo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.infoBg, border: `2px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }} onClick={() => photoRef.current?.click()}>
                  {pForm.photo_url ? <img src={pForm.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <span style={{ fontSize: 24 }}>+</span>}
                </div>
                <div><div style={{ fontSize: 13, color: C.mid, fontWeight: 600 }}>Profil Fotoğrafı</div><div style={{ fontSize: 11, color: C.muted }}>Fotoğrafa tıklayarak yükleyin</div></div>
                <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                {[{ label: 'Adı *', key: 'first_name', placeholder: 'Ad' }, { label: 'Soyadı *', key: 'last_name', placeholder: 'Soyad' }, { label: 'Telefon', key: 'phone', placeholder: '0500 000 00 00' }, { label: 'E-posta', key: 'email', placeholder: 'ornek@mail.com' }].map(f => (
                  <div key={f.key}>
                    <label style={labelStyle}>{f.label}</label>
                    <input style={inputStyle} placeholder={f.placeholder}
                      value={(pForm as Record<string, unknown>)[f.key] as string || ''}
                      onChange={e => setPForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Doğum Tarihi</label>
                  <input type="date" style={inputStyle} value={pForm.birth_date} onChange={e => setPForm(p => ({ ...p, birth_date: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Durum</label>
                  <select style={selectStyle} value={pForm.status} onChange={e => setPForm(p => ({ ...p, status: e.target.value as Patient['status'] }))}>
                    <option value="aktif">Aktif</option>
                    <option value="tamamlandı">Tamamlandı</option>
                    <option value="iptal">İptal</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Toplam Ücret (₺)</label>
                  <input type="number" style={inputStyle} value={pForm.total_fee} onChange={e => setPForm(p => ({ ...p, total_fee: Number(e.target.value) }))} placeholder="0" />
                </div>
                <div>
                  <label style={labelStyle}>Alınan Ücret (₺)</label>
                  <input type="number" style={inputStyle} value={pForm.paid_fee} onChange={e => setPForm(p => ({ ...p, paid_fee: Number(e.target.value) }))} placeholder="0" />
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={labelStyle}>Verilen Hizmetler</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {SERVICES.map(s => {
                    const active = pForm.services?.includes(s)
                    return (
                      <div key={s} onClick={() => setPForm(p => ({ ...p, services: active ? p.services.filter(x => x !== s) : [...(p.services || []), s] }))}
                        style={{ padding: '6px 13px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontWeight: 600, background: active ? C.dark : '#F0F2F7', color: active ? '#fff' : C.muted, border: `1px solid ${active ? C.dark : C.border}` }}>
                        {s}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={labelStyle}>Notlar</label>
                <textarea style={{ ...inputStyle, height: 70, resize: 'vertical' }} value={pForm.notes} onChange={e => setPForm(p => ({ ...p, notes: e.target.value }))} placeholder="Hasta notları..." />
              </div>

              {formError && <div style={{ color: C.danger, fontSize: 12, marginTop: 8 }}>{formError}</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button style={{ ...btnStyle, flex: 1, opacity: saving ? 0.7 : 1 }} onClick={savePatient} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                {editingPatient && <button style={{ background: 'transparent', color: C.danger, border: `1px solid ${C.danger}44`, borderRadius: 8, padding: '9px 16px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }} onClick={() => deletePatient(editingPatient.id)}>Sil</button>}
                <button style={btnOutlineStyle} onClick={() => { setShowPatientForm(false); setEditingPatient(null); setPForm(emptyPatient); setFormError('') }}>İptal</button>
              </div>
            </div>
          </div>
        )}

        {/* Patient Detail Modal */}
        {viewingPatient && (() => {
          const p = patients.find(x => x.id === viewingPatient.id) || viewingPatient
          const kalan = p.total_fee - p.paid_fee
          const patAppts = appointments.filter(a => a.patient_id === p.id)
          return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,25,55,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}
              onClick={() => setViewingPatient(null)}>
              <div style={{ background: C.card, borderRadius: '16px 16px 0 0', padding: '24px 24px 32px', width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', animation: 'slideUp 0.25s ease', border: `1px solid ${C.border}` }}
                onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
                  <Avatar patient={p} size={60} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.dark }}>{p.first_name} {p.last_name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: C.muted }}>{p.phone}</span>
                      <WaButton phone={p.phone} />
                    </div>
                    <div style={{ marginTop: 8 }}><Badge type={p.status} /></div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[{ lbl: 'Toplam', val: `₺${p.total_fee.toLocaleString()}`, c: C.dark }, { lbl: 'Alınan', val: `₺${p.paid_fee.toLocaleString()}`, c: C.success }, { lbl: 'Kalan', val: `₺${kalan.toLocaleString()}`, c: kalan > 0 ? C.warn : C.success }].map((s, i) => (
                    <div key={i} style={{ background: '#F5F7FC', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: s.c }}>{s.val}</div>
                      <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>{s.lbl}</div>
                    </div>
                  ))}
                </div>
                {p.services?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10.5, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontWeight: 600 }}>Hizmetler</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{p.services.map(s => <Badge key={s} type="aktif" />)}</div>
                  </div>
                )}
                {p.notes && <div style={{ background: '#F5F7FC', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: C.mid }}>{p.notes}</div>}
                {patAppts.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10.5, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600 }}>Randevular</div>
                    {patAppts.map(a => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                        <span>{a.date} {a.time} — {a.service}</span>
                        <Badge type={a.status} />
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button style={btnStyle} onClick={() => { setViewingPatient(null); setPForm({ ...p, birth_date: p.birth_date || '', photo_url: p.photo_url || '' }); setEditingPatient(p); setShowPatientForm(true) }}>Düzenle</button>
                  <button style={btnSmStyle} onClick={() => { setViewingPatient(null); setAForm({ ...emptyAppt, patient_id: p.id, patient_name: `${p.first_name} ${p.last_name}`, service: p.services?.[0] || '' }); setShowApptForm(true) }}>Randevu Al</button>
                  <button style={btnOutlineStyle} onClick={() => setViewingPatient(null)}>Kapat</button>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Appointment Form Modal */}
        {showApptForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,25,55,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}
            onClick={() => setShowApptForm(false)}>
            <div style={{ background: C.card, borderRadius: '16px 16px 0 0', padding: '24px 24px 32px', width: '100%', maxWidth: 460, maxHeight: '92vh', overflowY: 'auto', animation: 'slideUp 0.25s ease', border: `1px solid ${C.border}` }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginBottom: 20 }}>{editingAppt ? 'Randevu Düzenle' : 'Yeni Randevu'}</div>
              <label style={labelStyle}>Hasta</label>
              <select style={selectStyle} value={aForm.patient_id} onChange={e => {
                const pat = patients.find(p => p.id === e.target.value)
                setAForm(f => ({ ...f, patient_id: e.target.value, patient_name: pat ? `${pat.first_name} ${pat.last_name}` : '' }))
              }}>
                <option value="">Seçin...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
              <label style={labelStyle}>Hizmet</label>
              <select style={selectStyle} value={aForm.service} onChange={e => setAForm(f => ({ ...f, service: e.target.value }))}>
                <option value="">Seçin...</option>
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Tarih</label><input type="date" style={inputStyle} value={aForm.date} onChange={e => setAForm(f => ({ ...f, date: e.target.value }))} /></div>
                <div>
                  <label style={labelStyle}>Saat</label>
                  <select style={selectStyle} value={aForm.time} onChange={e => setAForm(f => ({ ...f, time: e.target.value }))}>
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <label style={labelStyle}>Durum</label>
              <select style={selectStyle} value={aForm.status} onChange={e => setAForm(f => ({ ...f, status: e.target.value as Appointment['status'] }))}>
                <option value="bekliyor">Bekliyor</option>
                <option value="tamamlandı">Tamamlandı</option>
                <option value="iptal">İptal</option>
              </select>
              <label style={labelStyle}>Not</label>
              <input style={inputStyle} value={aForm.note} onChange={e => setAForm(f => ({ ...f, note: e.target.value }))} placeholder="Randevu notu..." />
              {formError && <div style={{ color: C.danger, fontSize: 12, marginTop: 8 }}>{formError}</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button style={{ ...btnStyle, flex: 1, opacity: saving ? 0.7 : 1 }} onClick={saveAppt} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                <button style={btnOutlineStyle} onClick={() => { setShowApptForm(false); setEditingAppt(null); setAForm(emptyAppt); setFormError('') }}>İptal</button>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Form Modal */}
        {showTxForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,25,55,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}
            onClick={() => setShowTxForm(false)}>
            <div style={{ background: C.card, borderRadius: '16px 16px 0 0', padding: '24px 24px 32px', width: '100%', maxWidth: 440, maxHeight: '92vh', overflowY: 'auto', animation: 'slideUp 0.25s ease', border: `1px solid ${C.border}` }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginBottom: 20 }}>Yeni İşlem</div>
              <label style={labelStyle}>İşlem Türü</label>
              <select style={selectStyle} value={tForm.type} onChange={e => setTForm(f => ({ ...f, type: e.target.value as Transaction['type'] }))}>
                <option value="tahsilat">Tahsilat (Gelir)</option>
                <option value="gider">Gider</option>
              </select>
              <label style={labelStyle}>Hasta (Opsiyonel)</label>
              <select style={selectStyle} value={tForm.patient_id} onChange={e => {
                const pat = patients.find(p => p.id === e.target.value)
                setTForm(f => ({ ...f, patient_id: e.target.value, patient_name: pat ? `${pat.first_name} ${pat.last_name}` : '-' }))
              }}>
                <option value="">— Seçin —</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
              <label style={labelStyle}>Tutar (₺)</label>
              <input type="number" style={inputStyle} value={tForm.amount || ''} onChange={e => setTForm(f => ({ ...f, amount: Number(e.target.value) }))} placeholder="0" />
              <label style={labelStyle}>Tarih</label>
              <input type="date" style={inputStyle} value={tForm.date} onChange={e => setTForm(f => ({ ...f, date: e.target.value }))} />
              <label style={labelStyle}>Açıklama</label>
              <input style={inputStyle} value={tForm.description} onChange={e => setTForm(f => ({ ...f, description: e.target.value }))} placeholder="Ödeme açıklaması..." />
              {formError && <div style={{ color: C.danger, fontSize: 12, marginTop: 8 }}>{formError}</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button style={{ ...btnStyle, flex: 1, opacity: saving ? 0.7 : 1 }} onClick={saveTx} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                <button style={btnOutlineStyle} onClick={() => { setShowTxForm(false); setTForm(emptyTx); setFormError('') }}>İptal</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
