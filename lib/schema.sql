-- =====================================================
-- PERANSA ESTETİK CRM — Supabase Database Schema
-- Supabase SQL Editor'da çalıştırın
-- =====================================================

-- 1. USERS tablosu (admin hesabı)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PATIENTS tablosu
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  birth_date DATE,
  services TEXT[] DEFAULT '{}',
  total_fee NUMERIC(10,2) DEFAULT 0,
  paid_fee NUMERIC(10,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'tamamlandı', 'iptal')),
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. APPOINTMENTS tablosu
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  service TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  note TEXT DEFAULT '',
  status TEXT DEFAULT 'bekliyor' CHECK (status IN ('bekliyor', 'tamamlandı', 'iptal')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRANSACTIONS tablosu (Cari hesap)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL DEFAULT '-',
  type TEXT NOT NULL CHECK (type IN ('tahsilat', 'gider')),
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Row Level Security (RLS) — Service role ile erişim
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Service role her şeye erişebilir (API routes için)
CREATE POLICY "Service role full access" ON users FOR ALL USING (true);
CREATE POLICY "Service role full access" ON patients FOR ALL USING (true);
CREATE POLICY "Service role full access" ON appointments FOR ALL USING (true);
CREATE POLICY "Service role full access" ON transactions FOR ALL USING (true);

-- 7. İlk admin kullanıcısını oluşturun
-- NOT: Şifreyi bcrypt hash'i olarak girin
-- Şifre "peransa2026" için hash (node.js ile: require('bcryptjs').hashSync('peransa2026', 10))
-- Aşağıdaki değeri kendi hash'inizle değiştirin:
INSERT INTO users (username, password_hash, display_name, role)
VALUES (
  'Sanaz',
  '$2a$10$PLACEHOLDER_REPLACE_WITH_REAL_HASH',
  'Sanaz Asadi',
  'admin'
) ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- KURULUM TAMAMLANDI
-- =====================================================
