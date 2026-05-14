export interface Patient {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  birth_date: string
  services: string[]
  total_fee: number
  paid_fee: number
  notes: string
  status: 'aktif' | 'tamamlandı' | 'iptal'
  photo_url?: string
  created_at: string
}

export interface Appointment {
  id: string
  patient_id: string
  patient_name: string
  service: string
  date: string
  time: string
  note: string
  status: 'bekliyor' | 'tamamlandı' | 'iptal'
  created_at: string
}

export interface Transaction {
  id: string
  patient_id?: string
  patient_name: string
  type: 'tahsilat' | 'gider'
  amount: number
  date: string
  description: string
  created_at: string
}

export interface User {
  id: string
  username: string
  display_name: string
  role: string
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}
