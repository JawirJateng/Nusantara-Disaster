# Perbaikan Sebelum Deploy (Hosting Gratis)

Dibuat dari audit seluruh repo. Urutkan pengerjaan dari atas ke bawah.
Centang item setelah selesai dan diverifikasi.

Stack yang disarankan (gratis):
- Frontend: Vercel Hobby
- Backend: Render Free Web Service
- Database: Neon Free (PostgreSQL)
- Uptime/cron: cron-job.org

Target beban: situs publik, puluhan–ratusan pengunjung, backend 1 instance ±512 MB, DB ±0,5 GB.

## Catatan implementasi (14 Nov 2026)

- **1.** `JwtModule.registerAsync` + cek di `JwtStrategy` (ConfigModule memuat `.env` sebelum DI). Secret baru ada di `backend/.env` dan `.env` root (keduanya gitignored); `docker compose` memakai `${JWT_SECRET:?...}`.
- **2.** Seed wajib `ADMIN_PASSWORD` (opsional `ADMIN_EMAIL`); form login dikosongkan; password admin lokal sudah dirotasi.
- **4.** Pemanggilan `fetchAndSyncDisasterNews()` di `findAll()` dihapus; cron 10 menit + `onModuleInit` tetap.
- **5.** `@Min(1) @Max(100)`; GeoJSON tetap memaksa 500 di service.
- **6.** `backend/src/health/health.controller.ts` → `GET /api/v1/health`.
- **8.** `bullmq` & `@nestjs/swagger` dicabut, `@nestjs/mapped-types` + `@nestjs/throttler` dipasang. `start:prod` diperbaiki ke `node dist/src/main`.
- **9.** CORS dari `CORS_ORIGIN` (compose default `http://localhost:3000`); throttle global 120/menit, login 5/menit.
- **10.** `backend/dist` & `backend/.env` sudah `git rm --cached`; `.dockerignore` dibuat di `backend/` dan `frontend/`.
- **11.** `backend/.env.example` dan `frontend/.env.example` dibuat.
- **13.** `provinceFromRegion()` di adapter BMKG (cocokkan nama provinsi, bukan potong kalimat) + test.
- **16.** Cron harian 03:00 menghapus berita > 90 hari; retensi `SyncLog` 30 hari sudah ada.
- **17.** 10 file `ui/*` mati, `EventDetailDrawer`, `EventListModal`, `check-api.js`, `list-all-events.js` dihapus; 4 paket Radix dicabut (`react-select` tetap karena dipakai filter).
- **15.** Basemap MapTiler aktif lewat `NEXT_PUBLIC_MAPTILER_KEY` (`streets-v4`, raster 256px); kosong = fallback OSM. Atribusi ikut menyesuaikan. Di Vercel env ini harus diisi lalu **redeploy** (dibaca saat build).
- **18.** Tidak dihapus: `frontend/Dockerfile` produksi memakai `.next/standalone`.
- **20.** Tidak diubah: `meta.total` adalah jumlah baris mentah; tidak ada konsumen di frontend, dan dedupe di level halaman tidak bisa dihitung murah.

---

## P0 — WAJIB, jangan deploy sebelum selesai

### [x] 1. Ganti JWT secret dan hapus fallback

**File:** `backend/.env`, `backend/src/auth/auth.module.ts:12`, `backend/src/auth/strategies/jwt.strategy.ts:12`

**Masalah:** Secret JWT ada di repo publik dan ada nilai fallback di kode. Siapa pun bisa membuat token `SUPER_ADMIN` sendiri.

**Tindakan:**
1. Buat secret baru yang panjang dan acak (minimal 32 karakter), simpan hanya di environment hosting.
2. Hapus fallback di kedua file:

```ts
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET belum diset');
```

3. Hapus file env dari git (riwayat lama tetap menyimpan secret, jadi secret lama tetap harus dianggap bocor):

```powershell
git rm --cached backend/.env
```

4. Tambahkan ke `.gitignore`:

```
.env
.env.*
!.env.example
dist/
*.tsbuildinfo
```

**Verifikasi:** jalankan backend tanpa `JWT_SECRET` → harus gagal start, bukan memakai secret default.

---

### [x] 2. Hapus admin default `admin123`

**File:** `backend/prisma/seed.ts:39-50`, `frontend/src/app/admin/page.tsx:11-12`

**Masalah:** Hash password seed sudah diverifikasi cocok dengan `admin123`. Form login juga sudah terisi otomatis dengan kredensial itu. Repo publik.

**Tindakan:**
1. Seed admin dari env:

```ts
const email = process.env.ADMIN_EMAIL ?? 'admin@ndw.go.id';
const password = process.env.ADMIN_PASSWORD;
if (!password) throw new Error('ADMIN_PASSWORD belum diset');
const hashedPassword = await bcrypt.hash(password, 10);
```

2. Kosongkan nilai awal form login:

```ts
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
```

3. Ganti password admin di database sebelum situs dibuka publik.

**Verifikasi:** password `admin123` ditolak; login hanya berhasil dengan password baru.

---

### [x] 3. Seed tidak boleh menghapus data  

**File:** `backend/prisma/seed.ts:36-37`, `docker-compose.yml:50`

**Masalah:** Seed menjalankan `deleteMany` untuk semua event dan berita, dan Docker Compose menjalankan seed setiap backend start. Restart/redeploy = data produksi hilang.

**Tindakan:**
1. Hapus dua baris ini:

```ts
await prisma.disasterEvent.deleteMany({});
await prisma.newsItem.deleteMany({});
```

2. Jalankan seed sekali secara manual, jangan di command start produksi.
3. Kalau butuh reset untuk development, buat flag terpisah:

```ts
if (process.env.RESET_DB === 'true') {
  await prisma.disasterEvent.deleteMany({});
  await prisma.newsItem.deleteMany({});
}
```

**Verifikasi:** jalankan backend dua kali → jumlah event tidak berubah.

---

### [x] 4. Hentikan fetch RSS di dalam request

**File:** `backend/src/news/news.service.ts:108-113`

**Masalah:** `findAll()` memanggil `fetchAndSyncDisasterNews()` setiap `GET /news`. Frontend polling tiap 30 detik, jadi 4 RSS feed ditarik terus-menerus.

**Tindakan:** hapus baris ini dari `findAll()`:

```ts
// Trigger background sync from live APIs
this.fetchAndSyncDisasterNews().catch(() => {});
```

Sinkronisasi cukup lewat `onModuleInit` dan `@Cron(EVERY_10_MINUTES)`.

**Verifikasi:** panggil `/news` 10 kali → log fetch RSS tidak bertambah.

---

### [x] 5. Batasi `limit` API

**File:** `backend/src/events/dto/event-filter.dto.ts:38-41`

**Masalah:** `limit` tidak dibatasi. `?limit=1000000` bisa menghabiskan RAM instance gratis.

**Tindakan:**

```ts
import { Max, Min } from 'class-validator';

@IsOptional()
@Type(() => Number)
@IsNumber()
@Min(1)
@Max(100)
limit?: number;
```

Untuk GeoJSON, tetap panggil `findAll({ ...filter, limit: 500 })` di kode (bukan dari input user).

**Verifikasi:** `GET /api/v1/events?limit=1000000` → 400 Bad Request.

---

### [x] 6. Tambah endpoint health + uptime ping

**File baru:** `backend/src/health/health.controller.ts` (daftarkan di `app.module.ts`)

**Masalah:** Render Free menidurkan service setelah ±15 menit idle. Cron di dalam Nest berhenti, dan request pertama setelah bangun menunggu 30–60 detik.

**Tindakan:**

```ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

Lalu daftarkan `HealthController` di `AppModule`, dan ping `https://<backend>/api/v1/health` tiap 10 menit lewat cron-job.org.

**Verifikasi:** endpoint mengembalikan 200; service tidak tidur selama cron aktif.

---

## P1 — Sebaiknya selesai sebelum publik

### [x] 7. Rapikan cron sinkronisasi dan log

**File:** `backend/src/sync/sync.service.ts:31-50, 306-328`

**Masalah:** Tiap menit, 5 sumber menulis `SyncLog` (7.200 baris/hari). Empat sumber hanya simulasi angka acak, jadi status di dashboard palsu.

**Status:** simulasi sudah dihapus (IDSE). Scheduler tetap tiap menit tetapi tiap sumber hanya jalan sesuai `pollIntervalMinutes`; `SyncLog` > 30 hari dibersihkan otomatis.

**Tindakan:**
1. Hapus `simulateSourceSync()` dan panggilannya.
2. Hanya sinkronkan BMKG (satu-satunya sumber nyata).
3. Hormati `pollIntervalMinutes` milik sumber:

```ts
const due = !source.lastSyncAt ||
  Date.now() - source.lastSyncAt.getTime() >= source.pollIntervalMinutes * 60_000;
if (!due) continue;
```

4. Jadwalkan minimal tiap 5 menit, bukan tiap menit.

**Verifikasi:** jumlah `SyncLog` baru per jam turun drastis; tidak ada log sumber palsu.

---

### [x] 8. Benahi dependensi backend

**File:** `backend/package.json`, `backend/src/events/dto/update-event.dto.ts:1`

**Masalah:** `@nestjs/mapped-types` diimpor langsung tapi tidak ada di dependencies (hanya ikut dari `@nestjs/swagger`). `bullmq` dan `@nestjs/swagger` tidak dipakai.

**Tindakan:**

```powershell
cd backend
npm uninstall bullmq @nestjs/swagger
npm install @nestjs/mapped-types
```

**Verifikasi:** `npm ci` lalu `npm run build` berhasil.

---

### [x] 9. Batasi CORS dan login

**File:** `backend/src/main.ts:8-12`, `backend/src/auth/auth.controller.ts`

**Masalah:** `origin: '*'` dan tidak ada pembatas percobaan login.

**Tindakan:**
1. Ganti CORS:

```ts
app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(',') ?? true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
});
```

2. Tambah `@nestjs/throttler`, aktifkan global, dan beri limit ketat untuk `/auth/login` (mis. 5 percobaan/menit per IP).

**Verifikasi:** request dari origin lain ditolak; login gagal berulang menghasilkan 429.

---

### [x] 10. Bersihkan file yang ter-commit dan buat `.dockerignore`

**File:** `backend/.env`, `backend/dist/` (109 file), `.gitignore`

**Tindakan:**

```powershell
git rm -r --cached backend/dist
git rm --cached backend/.env
```

Buat `backend/.dockerignore` dan `frontend/.dockerignore`:

```
node_modules
.env
.env.*
dist
.next
*.tsbuildinfo
```

**Catatan:** secret yang pernah ter-commit tetap ada di history git. Karena itu langkah 1 (rotate JWT) wajib. Kalau repo harus benar-benar bersih, pakai `git filter-repo` sebelum repo dibagikan.

---

### [x] 11. Buat contoh env dan dokumentasi deploy

**File baru:** `backend/.env.example`, `frontend/.env.example`

`backend/.env.example`:

```
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
JWT_SECRET="ganti-dengan-random-32-karakter"
CORS_ORIGIN="https://domain-frontend.vercel.app"
PORT=4000
ADMIN_EMAIL="admin@domain.com"
ADMIN_PASSWORD="ganti-password-kuat"
```

`frontend/.env.example`:

```
NEXT_PUBLIC_API_URL="https://domain-backend.onrender.com/api/v1"
```

**Verifikasi:** deploy hanya butuh env di atas, tidak ada lagi `localhost`.

---

### [x] 12. Perbaiki zona waktu BMKG

**File:** `backend/src/sync/sync.service.ts:52-77`

**Masalah:** Semua tanggal diberi offset `+07:00`, padahal BMKG memakai WIB/WITA/WIT.

**Tindakan:**

```ts
const offset = g.Jam?.includes('WIT') ? '+09:00'
  : g.Jam?.includes('WITA') ? '+08:00'
  : '+07:00';
const isoStr = `${year}-${month}-${day}T${cleanJam}${offset}`;
```

**Verifikasi:** gempa berlabel WITA/WIT tidak meleset 1–2 jam.

---

### [x] 13. Perbaiki pengambilan provinsi

**File:** `backend/src/sync/sync.service.ts:224`

**Masalah:** `province` diambil dari potongan terakhir `g.Wilayah`. Kalau BMKG mengirim kalimat seperti "Pusat gempa berada di laut 24 km selatan Enggano", kolom provinsi berisi kalimat itu.

**Tindakan:** pakai `g.Wilayah` sebagai `locationName`, dan isi `province` hanya kalau bentuknya nama provinsi yang valid; kalau tidak, isi `null` atau `'Indonesia'`.

**Verifikasi:** halaman detail tidak lagi menampilkan lokasi ganda.

---

### [x] 14. Tambah test minimal

**File baru:** `backend/src/sync/sync.service.spec.ts`

**Masalah:** Tidak ada satu test pun untuk parser tanggal, dedupe gempa, dan auth.

**Tindakan:** minimal dua test:
1. `parseBmkgDate` untuk WIB, WITA, WIT.
2. Dedupe gempa: dua gempa berdekatan waktu dan lokasi hanya menghasilkan satu event.

**Verifikasi:** `npm test` lulus.

---

### [x] 15. Ganti tile peta OSM publik

**File:** `frontend/src/components/MapLibreMap.tsx:22`

**Masalah:** `tile.openstreetmap.org` tidak untuk trafik produksi.

**Tindakan:** pakai free tier MapTiler/Thunderforest, simpan API key di env publik frontend, atau tetap OSM hanya kalau trafik kecil dan atribusi dipertahankan.

**Verifikasi:** peta tampil tanpa error 403.

---

### [x] 16. Batasi umur berita dan log

**File:** `backend/src/news/news.service.ts`, `backend/src/sync/sync.service.ts`

**Masalah:** Data tumbuh tanpa batas; DB gratis 0,5 GB akan penuh.

**Status:** retensi `SyncLog` sudah berjalan (per sumber, default 30 hari). Retensi berita belum diimplementasikan.

**Tindakan:** tambah cron harian:

```ts
await this.prisma.newsItem.deleteMany({
  where: { publishedAt: { lt: new Date(Date.now() - 90 * 24 * 3600 * 1000) } },
});
await this.prisma.syncLog.deleteMany({
  where: { createdAt: { lt: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
});
```

---

## P2 — Rapikan kalau sempat

### [x] 17. Hapus kode dan dependensi mati

- `frontend/src/components/EventDetailDrawer.tsx`
- `frontend/src/components/EventListModal.tsx`
- 11 file `frontend/src/components/ui/*` yang tidak diimpor (sisakan `button.tsx` dan `badge.tsx`)
- `check-api.js`, `list-all-events.js`
- Paket frontend: `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-select`, `@radix-ui/react-tabs`

Sekitar 831 baris dan 7 dependensi.

### [ ] 18. Hapus `output: 'standalone'` kalau tidak memakai Docker

**File:** `frontend/next.config.js`

Vercel tidak membutuhkannya.

### [x] 19. Buat migrasi Prisma

Saat ini hanya `prisma db push`. Untuk produksi:

**Status:** sudah dibuat baseline `20251114000000_init` dan migration IDSE `20251114000100_idse`. Deploy memakai `npx prisma migrate deploy`; untuk DB lama yang dibuat dengan `db push`, jalankan `npx prisma migrate resolve --applied 20251114000000_init` sekali.

```powershell
cd backend
npx prisma migrate dev --name init
```

Lalu saat deploy pakai `npx prisma migrate deploy`.

### [ ] 20. Perbaiki `meta.total`

**File:** `backend/src/events/events.service.ts:43-76`

`total` dihitung sebelum dedupe, sehingga bisa lebih besar dari jumlah item yang dikembalikan. Hitung total setelah dedupe, atau jelaskan di UI bahwa total adalah data mentah.

---

## Urutan Deploy Gratis

### [ ] 21. Database Neon

1. Buat project di Neon Free.
2. Salin connection string dengan `?sslmode=require`.
3. Dari lokal, setelah P0 selesai:

```powershell
cd backend
$env:DATABASE_URL="<connection-string-neon>"
npx prisma generate
npx prisma migrate deploy
$env:ADMIN_PASSWORD="<password-kuat>"
npx ts-node prisma/seed.ts
```

### [ ] 22. Backend di Render

- New → Web Service → repo GitHub
- Root Directory: `backend`
- Build Command: `npm ci --include=dev && npx prisma generate && npm run build`
- Start Command: `node dist/src/main`
- Environment:
  - `DATABASE_URL`
  - `JWT_SECRET` (baru)
  - `CORS_ORIGIN=https://<domain-vercel>`
  - `NODE_ENV=production`

Catatan: `--include=dev` wajib karena Render mengeset `NODE_ENV=production`; tanpa itu `nest` dan `prisma` tidak terpasang saat build.

### [ ] 23. Frontend di Vercel

- Import repo, Root Directory: `frontend`
- Framework: Next.js
- Environment: `NEXT_PUBLIC_API_URL=https://<backend>.onrender.com/api/v1`
- Deploy. `NEXT_PUBLIC_*` dibaca saat build, jadi ubah env → redeploy.

### [ ] 24. Uptime dan sinkronisasi

- Daftar di cron-job.org.
- URL: `https://<backend>.onrender.com/api/v1/health`
- Interval: 10 menit.
- Tujuan: mencegah Render tidur, supaya cron internal tetap jalan.

---

## Checklist Verifikasi Setelah Deploy

- [ ] `GET /api/v1/health` → 200
- [ ] `GET /api/v1/events?limit=100` → data muncul
- [ ] `GET /api/v1/events?limit=1000000` → 400
- [ ] Login dengan `admin123` → gagal
- [ ] Login dengan password baru → berhasil
- [ ] Hapus kejadian dengan token palsu buatan sendiri → 401
- [ ] Request `/news` berulang tidak memicu fetch RSS
- [ ] Peta tampil dan marker bisa diklik
- [ ] Klik marker → daftar kiri scroll ke kartu yang benar
- [ ] Panggil API dari origin lain → CORS ditolak
- [ ] Restart backend dua kali → data tidak hilang
- [ ] Cron-job.org sukses terus selama 1 jam
- [ ] Cek ukuran database setelah 1 hari

---

## Catatan

- Kuota free tier bisa berubah; cek dashboard masing-masing sebelum deploy.
- Repo GitHub publik saat ini. Setelah P0, anggap semua secret lama sudah bocor dan wajib diganti.
- Build lokal yang sudah diverifikasi: `nest build` (backend) dan `next build` (frontend, 12 halaman) berhasil.
