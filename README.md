# CleanBieber — Class Cleaning Management System
**Sistem Manajemen Jadwal & Verifikasi Piket Kelas Terpadu dengan AI & Notifikasi WhatsApp**

> **Kelas:** 10 SIJA B (36 Siswa)  
> **Kategori:** Modern SaaS School Operations  
> **Teknologi:** Next.js (App Router), TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL (Neon/Supabase), Google Gemini Vision AI, Fonnte WhatsApp API, Cloudinary, ExcelJS, Vercel Cron.

---

## 🎯 Gambaran Umum Produk

**CleanBieber** menggantikan papan tulis piket manual dan absensi kertas dengan platform digital yang rapi, transparan, dan terotomatisasi.

### Pengalaman Siswa (Tanpa Perlu Akun)
- Memilih nama dari roster 36 siswa Kelas 10 SIJA B.
- Mengetahui jadwal hari tetap dan penugasan spesifik hari ini (MBG, Nyapu, Helper).
- Mengunggah foto bukti kebersihan langsung dari kamera ponsel atau galeri.
- Memantau status verifikasi (Pending, Verified, Rejected) secara langsung dan transparan.

### Pengalaman Administrator (Login Terproteksi)
- Otentikasi aman dengan proteksi brute force rate limiting & sesi HttpOnly.
- Dashboard metrik kehadiran berbasis data real-time (Total Siswa, Piket Hari Ini, Sudah Verifikasi, Menunggu Verifikasi).
- Pusat Verifikasi Bukti dengan visualisasi **Google Gemini Vision AI** (deteksi objek meja, lantai, ember pel, kotak makan, dan confidence score).
- Moderasi langsung (Setujui / Tolak dengan alasan).
- **Penghapusan otomatis foto bukti** dari cloud storage segera setelah keputusan moderasi disimpan, melindungi privasi dan menghemat kuota penyimpanan.
- Manajemen data siswa (CRUD roster 36 siswa).
- Ekspor rekapitulasi kehadiran berkas **Microsoft Excel (.xlsx)** via ExcelJS.
- Otomatisasi pengingat harian (20:00 WIB) dan rekap mingguan via **Fonnte WhatsApp API** & **Vercel Cron Jobs**.

---

## 📅 Algoritma Rotasi Tugas Mingguan (Section 9)

Roster kelas terdiri dari **36 siswa** dengan pembagian hari piket tetap:
- **Senin (Day 1):** 7 siswa (orderIndex 0..6)
- **Selasa (Day 2):** 7 siswa (orderIndex 0..6)
- **Rabu (Day 3):** 7 siswa (orderIndex 0..6)
- **Kamis (Day 4):** 7 siswa (orderIndex 0..6)
- **Jumat (Day 5):** 8 siswa (orderIndex 0..7)

### Komposisi Tugas per Hari
- **Senin s.d. Kamis (7 siswa):**
  - **MBG (Makanan Bergizi Gratis):** 4 siswa (07:00 - 09:00)
  - **Nyapu:** 2 siswa (15:00 - 16:30)
  - **Helper:** 1 siswa (07:00 - 16:30)
- **Jumat (8 siswa):**
  - **MBG:** 4 siswa
  - **Nyapu:** 3 siswa
  - **Helper:** 1 siswa

### Jaminan Matematis Algoritma:
1. **Presisi Multiset:** Array slot tugas memiliki panjang tetap ($N = 7$ atau $8$) berisi jumlah tugas yang tepat.
2. **Pergeseran Deterministik:** Offset rotasi dihitung menggunakan:
   $$\text{offset} = (| \text{isoYear} \times 53 + \text{isoWeek} |) \pmod N$$
   Tugas untuk siswa dengan urutan $i$ adalah:
   $$\text{assignedTask} = \text{baseSlots}[(i + \text{offset}) \pmod N]$$
3. Karena pemetaan $(i + \text{offset}) \pmod N$ merupakan permutasi bijektif pada indeks $0 \dots N-1$, jumlah kuota tugas MBG, Nyapu, dan Helper **pasti terpenuhi 100% tepat** setiap minggunya, tanpa duplikasi, dan berotasi secara adil antarminggu.

---

## 🛠️ Persyaratan Lingkungan (Environment Variables)

Salin `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Isi variabel konfigurasi berikut:

| Variabel | Deskripsi | Default / Contoh |
|---|---|---|
| `DATABASE_URL` | URL koneksi PostgreSQL (Neon / Supabase pooled connection) | `postgresql://...` |
| `DIRECT_URL` | URL koneksi langsung PostgreSQL untuk migrasi | `postgresql://...` |
| `APP_URL` | URL publik aplikasi | `http://localhost:3000` |
| `CRON_SECRET` | Secret token untuk autentikasi endpoint Vercel Cron | `secret-cron-key` |
| `GEMINI_API_KEY` | API Key Google Gemini (untuk analisis visi kebersihan) | `AIzaSy...` |
| `GEMINI_MODEL` | Model Gemini Vision yang digunakan | `gemini-1.5-flash` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name untuk penyimpanan foto sementara | `cleanbieber-cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `1234567890` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `sec_...` |
| `FONNTE_TOKEN` | Token akun WhatsApp Gateway Fonnte | `fonnte_token_...` |
| `ADMIN_WHATSAPP_NUMBER` | Nomor WhatsApp admin tujuan pengingat & rekap | `081234567890` |
| `ADMIN_INITIAL_USERNAME` | Username bootstrap admin pertama | `admin` |
| `ADMIN_INITIAL_PASSWORD` | Password bootstrap admin pertama | `admin123` |

> *Catatan Pengujian Lokal:* Jika kredensial eksternal (PostgreSQL, Gemini, Cloudinary, Fonnte) belum diisi, CleanBieber secara cerdas menyediakan **fallback operasional** (penyimpanan file `.data/db.json`, temporary storage lokal, dan mock analitik aman) sehingga seluruh fitur dapat diuji secara penuh tanpa crash.

---

## 🚀 Panduan Menjalankan Secara Lokal

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npm run db:generate
```

### 3. Menjalankan Tes Unit & Logika Bisnis
Memverifikasi 13 uji otomatis (rotasi 52 minggu, alokasi Jumat 8 siswa, ISO week, password hash bcrypt, brute force rate limiting, export Excel, dan format WhatsApp):
```bash
npm test
```

### 4. Menjalankan Mode Pengembangan
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

### 5. Membangun Versi Produksi (Production Build)
```bash
npm run build
npm start
```

---

## 🔐 Kredensial Administrator Awal (Bootstrap)

- **URL Login Admin:** `/admin/login`
- **Username:** `admin` (atau sesuai `ADMIN_INITIAL_USERNAME`)
- **Password:** `admin123` (atau sesuai `ADMIN_INITIAL_PASSWORD`)

Setelah login, admin dapat mengganti password kapan saja melalui menu **Pengaturan** (`/admin/pengaturan`).

---

## ⏰ Konfigurasi Vercel Cron Jobs

Jadwal otomatisasi didefinisikan dalam `vercel.json`:

1. **Daily Reminder (`/api/cron/daily-reminder`):**
   - **Jadwal:** Minggu s.d. Kamis pukul 20:00 WIB (13:00 UTC) `0 13 * * 0-4`.
   - **Tindakan:** Mengidentifikasi petugas piket besok, menghitung tugas rotasi, dan mengirimkan pesan WhatsApp ke admin.
   - **Idempoten:** Dilindungi dari pengiriman ganda pada tanggal yang sama.

2. **Weekly Recap (`/api/cron/weekly-recap`):**
   - **Jadwal:** Jumat pukul 17:00 WIB (10:00 UTC) `0 10 * * 5`.
   - **Tindakan:** Menghimpun seluruh data piket Senin–Jumat, membuat file Excel `.xlsx`, dan mengirimkan rangkuman statistik serta lampiran dokumen ke WhatsApp admin via Fonnte.

3. **Storage Cleanup Retry (`/api/cron/cleanup-retry`):**
   - **Jadwal:** Setiap 30 menit `*/30 * * * *`.
   - **Tindakan:** Memproses ulang antrean penghapusan foto bukti jika sebelumnya terjadi kendala jaringan ke Cloudinary.

Semua endpoint Cron terproteksi header wajib:
```http
Authorization: Bearer <CRON_SECRET>
```

---

## 📂 Struktur Direktori Proyek

```
cleanbieber/
├── prisma/
│   ├── schema.prisma         # Definisi model database PostgreSQL Prisma
│   └── seed.ts               # Skrip seeding idempoten 36 siswa Kelas 10 SIJA B
├── public/                   # Aset publik, favicon, svg
├── src/
│   ├── app/
│   │   ├── page.tsx          # Beranda siswa & jadwal hari ini
│   │   ├── jadwal/           # Papan jadwal mingguan (Senin-Jumat)
│   │   ├── siswa/            # Direktori roster 36 siswa
│   │   ├── unggah/           # Formulir unggah foto bukti kebersihan
│   │   ├── status/           # Cek status verifikasi bukti siswa
│   │   ├── admin/
│   │   │   ├── login/        # Halaman autentikasi admin
│   │   │   ├── page.tsx      # Dashboard metrik & feed aktivitas
│   │   │   ├── jadwal/       # Inspeksi rotasi tugas mingguan
│   │   │   ├── verifikasi/   # Antrean verifikasi & modal analisis Gemini AI
│   │   │   ├── siswa/        # Manajemen data siswa & hari piket tetap
│   │   │   ├── statistik/    # Metrik & grafik kepatuhan piket
│   │   │   ├── rekap/        # Rekap mingguan & ekspor Excel (.xlsx)
│   │   │   └── pengaturan/   # Pengaturan Fonnte, Cloudinary, password admin
│   │   └── api/              # Route handlers & Vercel Cron endpoints
│   ├── components/
│   │   ├── PublicNavbar.tsx  # Header navigasi siswa & mobile menu
│   │   ├── AdminSidebar.tsx  # Sidebar navigasi admin desktop & drawer
│   │   ├── ThemeToggle.tsx   # Pengalih tema (Light / Dark mode)
│   │   ├── TaskBadge.tsx     # Pill badge MBG, Nyapu, Helper
│   │   ├── StatusBadge.tsx   # Pill badge Pending, Verified, Rejected
│   │   └── VerificationModal.tsx # Modal detail verifikasi & AI score
│   └── lib/
│       ├── rotation.ts       # Shared task assignment & ISO week rotation engine
│       ├── types.ts          # TypeScript interfaces & types
│       ├── initial-data.ts   # Dataset 36 siswa Kelas 10 SIJA B
│       ├── db.ts             # Lapisan abstraksi database (Prisma / local fallback)
│       ├── auth.ts           # Otentikasi, session cookie, & bcrypt hashing
│       ├── gemini.ts         # Google Gemini Vision AI service
│       ├── cloudinary.ts     # Temporary storage & deletion service
│       ├── fonnte.ts         # WhatsApp Gateway service & reminder formatter
│       └── excel.ts          # Generator laporan Excel (.xlsx) via ExcelJS
├── tests/
│   ├── rotation.test.ts      # Uji unit rotasi tugas & kalender ISO
│   └── submission_and_auth.test.ts # Uji keamanan, rate limiting, Excel, & WA
├── vercel.json               # Konfigurasi Vercel Cron Jobs
└── package.json
```

---

## 🛡️ Kebijakan Keamanan & Privasi

1. **Proteksi Akses Admin:** Seluruh rute administratif dan mutasi dilindungi validasi sesi server-side dengan cookie `HttpOnly`, `SameSite=Lax`, dan `Secure`.
2. **Pencegahan Brute Force:** Percobaan login dibatasi maksimal 5 kali per IP per 15 menit dengan status HTTP 429.
3. **Penyimpanan Foto Sementara:** Foto kebersihan disimpan sementara di Cloudinary / restricted storage dan **dihapus permanen** segera setelah keputusan verifikasi admin selesai disimpan.
4. **Validasi Server-Side:** Nama siswa, tanggal piket, dan tugas yang ditugaskan diverifikasi secara ketat di server menggunakan shared rotation engine. Siswa tidak dapat memalsukan jenis tugas.
5. **Kerahasiaan Kredensial:** Laporan Excel tidak pernah memuat URL foto sementara, token sesi, atau password hash.
