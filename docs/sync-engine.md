# Intelligent Disaster Data Synchronization Engine (IDSE)

Dokumen teknis untuk mesin sinkronisasi data bencana di backend Nusantara Disaster.
Terakhir diperbarui: 14 November 2026.

## 1. Alur

```text
API BMKG (gempaterkini, gempadirasakan)
        |
        v
BmkgAdapter (fetch + timeout + retry + rate limit)
        |
        v
Validasi + normalisasi (sync.core.ts)
        |
        v
Identitas: externalId stabil  ->  fingerprint (jika tidak ada externalId)
        |
        v
Content hash change detection
        |
        v
INSERT / UPDATE / SKIP / REJECT
        |
        v
PostgreSQL (DisasterEvent)
        |
        +--> SyncLog (metrik per eksekusi)
        +--> SyncCheckpoint (status per sumber)
        +--> DataSource (nextPollAt, failureCount, lastSyncStatus)
        +--> API lama (GET /api/v1/events, /events/geojson, /sources)
```

## 2. File utama

| File | Fungsi |
| --- | --- |
| `src/sync/sync.core.ts` | Validasi, normalisasi, fingerprint, content hash, merge metadata, backoff, parsing `Retry-After` |
| `src/sync/http-client.ts` | HTTP client dengan timeout, retry terbatas, backoff + jitter, `Retry-After` |
| `src/sync/adapters/bmkg.adapter.ts` | Adapter BMKG: parsing tanggal WIB/WITA/WIT, koordinat, identitas stabil |
| `src/sync/sync.service.ts` | Orkestrasi per sumber: lock, checkpoint, persistence decision, log, retention |
| `src/sync/sync.module.ts` | Registrasi adapter ke engine |
| `prisma/migrations/20251114000000_init` | Baseline skema lama (ditandai sudah diterapkan pada DB yang ada) |
| `prisma/migrations/20251114000100_idse` | Perubahan skema IDSE + backfill timestamp |

## 3. Identitas dan deduplication per sumber

| Sumber | Adapter | Identitas | Catatan |
| --- | --- | --- | --- |
| BMKG | Ada | `externalId = BMKG-<waktu UTC per menit>-<lat 1 desimal>-<lng 1 desimal>` | Magnitudo sengaja tidak dipakai karena BMKG sering merevisi magnitudo. |
| BNPB | Belum | - | Tidak ada integrasi API nyata; tidak ada data yang dibuat-buat. |
| PVMBG | Belum | - | Sama. |
| NASA FIRMS | Belum | - | Sama (butuh API key). |
| PetaBencana | Belum | - | Sama. |

Aturan umum:

1. Jika adapter memberi `externalId`, identitas = `(sourceId, externalId)`.
2. Jika tidak ada `externalId`, identitas = `(sourceId, identityFingerprint)`.
3. Identitas selalu **source-scoped**. Dua sumber berbeda tidak pernah digabung otomatis.
4. Tidak ada penggabungan lintas sumber; entity resolution adalah fitur terpisah.

Fingerprint = SHA-256 dari JSON stabil: `source`, `category`, `occurredAt`, `latitude` (4 desimal), `longitude` (4 desimal). Field volatil (waktu ambil, urutan field, metadata request) tidak ikut.

## 4. Content hash

Field yang masuk hash: `category`, `title`, `description`, `severity`, `status`, `verificationStatus`, `province`, `regency`, `locationName`, `latitude`, `longitude`, `occurredAt`, `metadata`.

Tidak masuk hash: `rawPayload`, `firstSeenAt`, `lastSeenAt`, `fetchedAt`, `createdAt`, `updatedAt`, ID internal, nama sumber.

Akibatnya:

- Polling dengan data identik -> **SKIP**, `updatedAt` tidak berubah.
- Perubahan field penting -> **UPDATE** hanya field yang dikirim; field yang tidak dikirim tidak di-null-kan.
- Metadata baru digabung (merge), nilai `null`/`undefined` tidak menimpa nilai lama.

## 5. Keputusan persistence

| Keputusan | Kondisi |
| --- | --- |
| INSERT | `(sourceId, identitas)` belum ada. Dilindungi unique constraint; jika kalah race (`P2002`) maka dilanjutkan sebagai UPDATE. |
| UPDATE | Identitas ada dan `contentHash` berbeda. Hanya field yang berubah yang ditulis. |
| SKIP | Identitas dan `contentHash` sama. Hanya `lastSeenAt` yang diperbarui lewat SQL langsung, sehingga `updatedAt` tetap. |
| REJECT | Gagal validasi (judul kosong, koordinat di luar rentang, waktu tidak valid/lebih dari 1 jam ke depan). Batch tetap lanjut. |
| REVIEW | Disimpan sebagai counter (`eventsReview`). Adapter BMKG tidak menghasilkan review karena external ID stabil; disediakan untuk sumber yang identitasnya lemah. |

## 6. Checkpoint, lock, dan interval

- `SyncCheckpoint` menyimpan status (`HEALTHY`, `RUNNING`, `DEGRADED`, `FAILED`, `DISABLED`), `lastSuccessfulSyncAt`, `lastAttemptAt`, `consecutiveFailures`.
- `lastSuccessfulSyncAt` hanya maju bila seluruh batch valid diproses tanpa error tulis. Batch gagal tidak memajukan checkpoint.
- Lock per sumber: `DataSource.syncLockExpiresAt` (TTL 10 menit) diakuisisi dengan satu `UPDATE ... WHERE` atomik. Proses kedua mendapat status `LOCKED`.
- Scheduler berjalan setiap menit, tetapi tiap sumber hanya disinkronkan bila `nextPollAt` sudah lewat.
- Sukses: `nextPollAt = now + pollIntervalMinutes`.
- Gagal: `nextPollAt = now + backoff(failureCount)` (exponential + jitter, batas 30 menit).
- `429` dengan `Retry-After` panjang: `nextPollAt = now + Retry-After`, tanpa menunggu di dalam request.
- `Retry-After` pendek: ditunggu di dalam request (maksimal 30 detik).

Interval awal per sumber (kolom `DataSource.pollIntervalMinutes`, dapat diubah tanpa deploy):

| Sumber | Interval | Alasan |
| --- | --- | --- |
| BMKG | 1 menit | Gempa dirasakan perlu cepat; feed BMKG memang diperbarui sering. |
| BNPB | 15 menit | Publikasi tidak real-time. |
| PVMBG | 15 menit | Status gunung api berubah lambat. |
| NASA FIRMS | 30 menit | Satelit, butuh API key. |
| PetaBencana | 5 menit | Laporan crowdsourced. |

Kolom konfigurasi lain: `timeoutMs` (default 10.000), `maxRetries` (default 2), `supportsIncremental` (default false), `logRetentionDays` (default 30).

Tidak ada sumber yang saat ini mendukung incremental retrieval (`updated_since`, cursor, ETag), jadi engine melakukan polling penuh + deduplication. Jika nanti tersedia, checkpoint `cursor` / `lastSeenUpdatedAt` sudah disiapkan.

## 7. Observability

`GET /api/v1/sources` mengembalikan per sumber:

- `lastSyncAt`, `lastSyncStatus`, `lastErrorMessage`, `failureCount`, `nextPollAt`
- `checkpoint.status`, `checkpoint.lastSuccessfulSyncAt`, `checkpoint.consecutiveFailures`
- `_count.events`, `_count.syncLogs`

`SyncLog` menyimpan per eksekusi: `eventsFetched`, `eventsProcessed`, `eventsValid`, `eventsCreated`, `eventsUpdated`, `eventsSkipped`, `eventsRejected`, `eventsReview`, `errorCount`, `retryCount`, `rateLimitCount`, `durationMs`, `startedAt`, `finishedAt`, `errorMessage` (maksimal 500 karakter, tanpa token/secret).

## 8. Retention

- Kejadian bencana **tidak pernah** dihapus oleh mesin sinkronisasi. Kejadian yang tidak muncul lagi di respons API tetap disimpan.
- `SyncLog` dibersihkan oleh cron harian 03:00 berdasarkan `DataSource.logRetentionDays` (default 30 hari), batch 5.000 baris.
- `rawPayload` disimpan untuk audit; belum ada pembersihan otomatis (lihat risiko).

## 9. Migration

```powershell
cd backend
npx prisma migrate deploy
npx prisma generate
```

DB lama yang dibuat dengan `prisma db push`:

```powershell
npx prisma migrate resolve --applied 20251114000000_init
npx prisma migrate deploy
```

Migration `20251114000100_idse` hanya menambah kolom/tabel/index dan membackfill `firstSeenAt`/`lastSeenAt`/`startedAt`/`finishedAt`. Tidak ada data kejadian yang diubah atau dihapus.

## 10. Testing

```powershell
# Siapkan database test (sekali)
docker exec ndw_postgres psql -U ndw_user -d ndw_db -c "CREATE DATABASE ndw_test;"

# Jalankan
docker compose run --rm --no-deps `
  -e DATABASE_URL="postgresql://ndw_user:ndw_password@postgres:5432/ndw_test?schema=public" `
  backend sh -c "npx prisma migrate deploy && npm test"
```

Test menolak berjalan jika nama database tidak mengandung `test`.

Cakupan: unit test untuk fingerprint/hash/validasi/tanggal/retry/`Retry-After`, dan integration test terhadap PostgreSQL untuk INSERT/SKIP/UPDATE, partial payload, race/lock, sumber berbeda, record tanpa external ID, reject, checkpoint gagal, data tidak terhapus, isolasi kegagalan antar sumber, serta idempotensi.
