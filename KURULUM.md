# Peransa Estetik CRM — Kurulum Rehberi

## Genel Bakış
Bu sistem şu teknolojilerle çalışır:
- **Next.js** (frontend + backend API)
- **Supabase** (veritabanı - ücretsiz)
- **Hostinger** (hosting)
- **Claude AI** (AI Asistan)

---

## ADIM 1: Supabase Kurulumu (veritabanı)

1. **https://supabase.com** adresine gidin
2. "Start your project" → ücretsiz hesap oluşturun
3. "New project" → proje adı: `peransa-crm`, şifre seçin, bölge: `Frankfurt (EU Central)`
4. Proje oluşturulduktan sonra sol menüden **SQL Editor** açın
5. `lib/schema.sql` dosyasının içeriğini kopyalayıp yapıştırın ve "Run" butonuna basın
6. Sol menüden **Settings > API** bölümüne gidin:
   - `Project URL` → kopyalayın (NEXT_PUBLIC_SUPABASE_URL)
   - `anon public` key → kopyalayın (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - `service_role secret` key → kopyalayın (SUPABASE_SERVICE_ROLE_KEY)

---

## ADIM 2: GitHub'a Yükleme

1. **https://github.com** → ücretsiz hesap açın
2. "New repository" → isim: `peransa-crm`, Private seçin, "Create repository"
3. Bilgisayarınıza Node.js kurun: https://nodejs.org (LTS versiyonu)
4. Terminal/Komut satırı açın, proje klasörüne gidin:

```bash
cd peransa-crm
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/KULLANICI_ADINIZ/peransa-crm.git
git push -u origin main
```

---

## ADIM 3: Hostinger Kurulumu

1. **hostinger.com.tr** → Business Web Hosting satın alın
2. Panel'e giriş yapın → **Node.js** bölümünü bulun
3. Node.js uygulaması oluşturun:
   - Node.js versiyonu: **18** veya üzeri
   - Application root: `/public_html/peransa-crm`
   - Application URL: domain adresiniz
   - Application startup file: `server.js`

4. **Git Deploy** özelliğini aktifleştirin, GitHub repo'nuzu bağlayın

---

## ADIM 4: Çevre Değişkenleri (.env)

Hostinger panelinde **Environment Variables** bölümüne şunları ekleyin:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
JWT_SECRET=peransa-gizli-anahtar-2026-buraya-uzun-bir-sey-yazin
ANTHROPIC_API_KEY=sk-ant-...
```

**ÖNEMLİ:** JWT_SECRET için rastgele uzun bir metin yazın (en az 32 karakter)

---

## ADIM 5: İlk Admin Kullanıcısı Oluşturma

Siteyi deploy ettikten sonra tek seferlik bu isteği yapın:

```bash
curl -X POST https://SITENIZ.com/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"setup_key": "JWT_SECRET_DEGERINIZ", "password": "peransa2026"}'
```

Veya Postman / Insomnia gibi bir araç kullanabilirsiniz.

Başarılı mesaj gelirse kullanıcı oluştu demektir.

---

## ADIM 6: Build & Deploy

```bash
npm install
npm run build
npm start
```

---

## Giriş Bilgileri
- **Kullanıcı adı:** Sanaz
- **Şifre:** peransa2026 (veya setup'ta belirlediğiniz)

---

## Claude API Key Alma
1. **https://console.anthropic.com** → hesap oluşturun
2. "API Keys" → "Create Key"
3. Oluşturulan key'i `ANTHROPIC_API_KEY` olarak kaydedin
4. Başlangıç için küçük bir kredi yükleyin (~$5 uzun süre yeter)

---

## Sorun Giderme

**"Cannot connect to database" hatası:**
→ Supabase URL ve key'leri doğru girildiğini kontrol edin

**"Unauthorized" hatası:**
→ Setup endpoint'ini çalıştırdığınızdan emin olun

**AI Asistan çalışmıyor:**
→ ANTHROPIC_API_KEY doğru girildiğini kontrol edin

---

## Destek
Herhangi bir adımda takılırsanız ekran görüntüsü alıp paylaşın.
