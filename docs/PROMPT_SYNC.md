# PROMPT_SYNC.md

# Nusantara Disaster --- Intelligent Disaster Data Synchronization Engine

**Dokumen:** Backend Engineering Prompt / Implementation Specification\
**Nama sistem:** Intelligent Disaster Data Synchronization Engine
(IDSE)\
**Produk:** Nusantara Disaster --- Version 1 Beta\
**Tujuan:** Sinkronisasi data bencana dari API eksternal secara efisien,
idempotent, dan tanpa menyimpan duplikasi yang tidak diperlukan.

------------------------------------------------------------------------

## 1. Instruksi Utama

Implementasikan atau tingkatkan mekanisme sinkronisasi data eksternal
pada proyek **Nusantara Disaster** menggunakan pendekatan:

**Intelligent Data Synchronization + Deduplication + Change Detection +
Incremental Synchronization.**

Masalah yang ingin diselesaikan:

-   Backend mengambil data dari beberapa API eksternal secara berkala.
-   API dapat mengembalikan kejadian yang sama pada beberapa siklus
    sinkronisasi.
-   Data yang identik tidak boleh terus-menerus dibuat sebagai record
    baru.
-   Data yang benar-benar baru harus disimpan.
-   Data yang sudah ada tetapi mengalami perubahan penting harus
    diperbarui.
-   Kegagalan API tidak boleh menyebabkan data lama hilang atau proses
    sinkronisasi menjadi tidak konsisten.
-   Proses sinkronisasi harus memperhatikan rate limit dan kebijakan
    masing-masing penyedia API.

**Penting:** lakukan inspeksi terhadap kode dan database yang sudah ada
sebelum membuat perubahan. Reuse arsitektur, model, tabel, service,
scheduler, dan integrasi API yang sudah tersedia. Jangan membuat ulang
sistem yang sebenarnya sudah berfungsi.

## 2. Batasan dan Prinsip Implementasi

Berbeda dari dokumen redesign frontend, tugas ini memang mencakup
backend dan database yang diperlukan untuk sinkronisasi.

Namun, perubahan harus tetap terbatas pada kebutuhan data
synchronization.

Jangan:

-   Mengubah kontrak API eksternal tanpa alasan.
-   Menghapus atau mengganti integrasi sumber data yang sudah berjalan.
-   Mengubah struktur data publik yang digunakan frontend tanpa
    kompatibilitas.
-   Menghapus data historis secara otomatis.
-   Menganggap setiap record dari dua sumber berbeda pasti merupakan
    kejadian yang sama.
-   Menganggap semua API mendukung `updated_since`, cursor, webhook,
    atau incremental endpoint.
-   Menganggap hash saja cukup untuk mengidentifikasi kejadian tanpa
    memahami kualitas data sumber.
-   Menyimpan setiap hasil polling sebagai record kejadian baru.
-   Melakukan sinkronisasi paralel tanpa mekanisme pencegah job ganda.

Pertahankan kompatibilitas endpoint yang digunakan frontend. Jika
perubahan skema diperlukan, buat migration yang aman dan
backward-compatible.

## 3. Arsitektur Sinkronisasi

Alur konseptual:

``` text
External Disaster APIs
        |
        v
API Collector / Source Adapter
        |
        v
Data Validation
        |
        v
Data Normalization
        |
        v
Identity Resolution
        |
        v
Deduplication
        |
        v
Change Detection
        |
        v
Persistence Decision
   /       |        \
 INSERT   UPDATE     SKIP
   \       |        /
        v
PostgreSQL + PostGIS
        |
        +----> Sync Logs / Metrics
        |
        +----> Existing Backend API
                    |
                    v
              Frontend Dashboard
```

Setiap sumber API harus diproses melalui adapter atau service yang
sesuai dengan format dan kemampuan sumber tersebut.

### 3.1 API Collector / Source Adapter

Tanggung jawab:

-   Mengambil data dari API eksternal.
-   Menggunakan timeout dan retry yang terkontrol.
-   Menghormati rate limit dan ketentuan provider.
-   Menangani pagination jika tersedia.
-   Menyimpan metadata waktu pengambilan data.
-   Mengubah kegagalan satu sumber agar tidak menghentikan sinkronisasi
    sumber lain.
-   Tidak langsung menulis respons mentah sebagai record kejadian tanpa
    validasi dan normalisasi.

Simpan konfigurasi per sumber, misalnya:

-   Nama sumber.
-   Base URL atau konfigurasi koneksi yang sudah digunakan proyek.
-   Status aktif/nonaktif.
-   Interval polling.
-   Timeout.
-   Batas retry.
-   Kapabilitas incremental retrieval.
-   Kebijakan retention log.

Jangan menaruh API key atau secret ke dalam source code, log, atau
dokumen.

### 3.2 Data Validation

Sebelum data diproses, validasi:

-   Identitas sumber.
-   External ID jika tersedia.
-   Kategori kejadian.
-   Waktu kejadian.
-   Koordinat jika tersedia.
-   Struktur atribut wajib.
-   Format dan tipe data.
-   Nilai geografis yang masuk akal.
-   Field yang dapat bernilai null.

Record yang tidak valid tidak boleh merusak keseluruhan batch. Catat
alasan penolakan secara aman pada log sinkronisasi.

### 3.3 Data Normalization

Samakan format internal lintas sumber tanpa menghilangkan nilai asli
yang penting.

Normalisasi dapat meliputi:

-   Nama kategori bencana.
-   Format tanggal dan waktu ke standar timezone yang konsisten,
    idealnya UTC untuk penyimpanan.
-   Latitude dan longitude.
-   Nama wilayah administratif.
-   Satuan magnitudo, kedalaman, curah hujan, atau parameter lain jika
    memang tersedia.
-   Nama field internal.

Simpan identitas dan metadata sumber agar asal data tetap dapat
ditelusuri.

## 4. Identitas Data dan Deduplication

### 4.1 Prioritas identitas kejadian

Gunakan urutan strategi berikut:

1.  **Provider external ID:** jika sumber menyediakan ID kejadian yang
    stabil.
2.  **Source-scoped identity:** kombinasi nama sumber dan external ID.
3.  **Deterministic fingerprint:** jika external ID tidak tersedia atau
    tidak stabil.

Untuk identitas berbasis ID, gunakan constraint unik seperti:

``` sql
UNIQUE (source_name, external_id)
```

Pastikan aturan null dan nilai kosong ditangani dengan benar. Jangan
mengandalkan unique constraint biasa untuk mengidentifikasi record
ketika `external_id` tidak tersedia.

### 4.2 Fingerprint untuk sumber tanpa external ID

Bangun fingerprint dari atribut yang relatif stabil dan benar-benar
tersedia, misalnya:

-   Source name.
-   Event category.
-   Event timestamp yang telah dinormalisasi.
-   Koordinat atau lokasi.
-   Parameter utama kejadian seperti magnitudo jika relevan.

Contoh konsep:

``` text
fingerprint = SHA256(
  normalized_source +
  normalized_category +
  normalized_event_time +
  normalized_location +
  stable_event_attributes
)
```

Jangan menggunakan seluruh payload mentah secara langsung jika payload
memiliki field dinamis seperti waktu pengambilan, urutan field, metadata
request, atau atribut yang berubah pada setiap respons.

Jika atribut identitas tidak cukup kuat, tandai sebagai kandidat
duplikat dan jangan melakukan penggabungan agresif. Lebih baik
mempertahankan dua record yang belum dapat dipastikan sama daripada
salah menggabungkan dua kejadian berbeda.

### 4.3 Duplikasi lintas sumber

Jangan otomatis menggabungkan data BMKG dan BNPB hanya karena lokasi dan
waktunya mirip.

Secara default, identitas unik bersifat **source-scoped**. Pengaitan dua
record dari sumber berbeda sebagai satu kejadian nasional dapat
dikembangkan sebagai fitur entity resolution terpisah, dengan confidence
score dan aturan yang dapat diaudit.

### 4.4 Idempotency

Menjalankan sinkronisasi berkali-kali dengan input yang sama harus
menghasilkan kondisi database yang sama.

Gunakan:

-   Unique constraints.
-   Transaction.
-   Atomic upsert.
-   Idempotency key atau identitas kejadian yang stabil.
-   Lock atau mekanisme job coordination untuk mencegah job sumber yang
    sama berjalan bersamaan.

Jangan hanya melakukan pola `SELECT` lalu `INSERT` tanpa perlindungan
unique constraint karena dua worker dapat memasukkan record yang sama
secara bersamaan.

## 5. Change Detection

Setiap record yang sudah dinormalisasi dibandingkan dengan data
tersimpan.

Gunakan hash dari field yang relevan untuk menentukan apakah konten
penting berubah.

Contoh:

  Siklus    Fingerprint identitas   Content hash   Tindakan
  --------- ----------------------- -------------- ----------
  Pertama   EVENT-001               HASH-A         INSERT
  Kedua     EVENT-001               HASH-A         SKIP
  Ketiga    EVENT-001               HASH-B         UPDATE
  Keempat   EVENT-002               HASH-C         INSERT

Pisahkan konsep:

-   **Identity fingerprint:** menentukan apakah record mengacu pada
    identitas kejadian yang sama.
-   **Content hash:** mendeteksi perubahan pada field kejadian yang
    disimpan.

Jangan memasukkan field volatile ke content hash, misalnya:

-   `fetched_at`
-   `last_checked_at`
-   Waktu request.
-   Urutan array yang tidak bermakna.
-   Metadata transport yang berubah setiap request.

Tentukan field yang dianggap penting untuk perubahan. Perubahan metadata
pengambilan data saja tidak boleh memicu update record kejadian.

Jika data tidak berubah:

-   Jangan INSERT.
-   Jangan UPDATE record kejadian.
-   Jangan mengubah `updated_at` kejadian hanya karena polling
    dilakukan.
-   Log hasil pemeriksaan pada tingkat batch atau agregat, bukan membuat
    record kejadian baru.

Jika data berubah:

-   UPDATE hanya field yang memang berubah.
-   Pertahankan field yang tidak diberikan pada respons parsial.
-   Jangan mengganti nilai valid dengan null hanya karena field tidak
    disertakan oleh API.
-   Catat perubahan jika audit history memang dibutuhkan.

## 6. Incremental Synchronization

Gunakan incremental retrieval apabila provider benar-benar mendukungnya.

Periksa dokumentasi dan implementasi setiap API untuk mengetahui apakah
tersedia:

-   `updated_since`
-   `start_date` / `end_date`
-   `last_updated`
-   Cursor.
-   Pagination.
-   ETag atau Last-Modified.
-   Webhook.

Jika tersedia, gunakan mekanisme tersebut dengan checkpoint per sumber.

Jika tidak tersedia:

-   Lakukan polling sesuai jadwal yang dikonfigurasi.
-   Ambil data dari endpoint yang tersedia.
-   Jalankan deduplication dan change detection sebelum persistence.
-   Jangan berpura-pura menggunakan incremental API yang tidak
    disediakan provider.

### 6.1 Checkpoint

Simpan checkpoint secara terpisah per sumber, misalnya:

-   `source_name`
-   `last_successful_sync_at`
-   `last_seen_updated_at` jika tersedia
-   `cursor` jika tersedia
-   `sync_status`
-   metadata checkpoint yang diperlukan

Checkpoint hanya boleh dimajukan setelah batch diproses dengan sukses
sesuai aturan konsistensi.

Gunakan overlap window jika diperlukan untuk menghindari kehilangan data
akibat keterlambatan publikasi atau perbedaan waktu. Deduplication akan
menangani data yang terambil kembali.

Jangan memajukan checkpoint ketika batch gagal di tengah proses sehingga
data dapat terlewat.

## 7. Adaptive Polling dan Interval Sinkronisasi

Interval harus dapat dikonfigurasi per sumber. Jangan menetapkan satu
interval untuk semua API.

Contoh konfigurasi awal untuk dievaluasi:

  Sumber                 Interval awal
  -------------------- ---------------
  BMKG gempa                1--2 menit
  PetaBencana.id            1--2 menit
  BNPB                         5 menit
  MAGMA Indonesia              5 menit
  PVMBG                    5--10 menit
  NASA FIRMS              15--30 menit
  Berita kebencanaan       5--15 menit

Angka tersebut hanya baseline konfigurasi. Sebelum digunakan, verifikasi
dokumentasi, rate limit, frekuensi publikasi, dan kebijakan setiap
provider.

Adaptive polling dapat diterapkan secara bertahap:

-   Normal: gunakan interval konfigurasi.
-   API mengalami rate limit: patuhi `Retry-After` jika tersedia.
-   API gagal sementara: exponential backoff dengan jitter.
-   API pulih: kembali bertahap ke interval normal.
-   Tidak ada data baru: tetap lakukan pemeriksaan sesuai kebutuhan
    freshness dan kebijakan sumber; jangan otomatis memperpanjang
    interval tanpa batas.
-   Ada webhook resmi: evaluasi event-driven update sebagai pelengkap
    polling.

Polling yang lebih jarang bukan pengganti deduplication. Pilih interval
berdasarkan kebutuhan aktual informasi dan batas provider, bukan
semata-mata untuk mengurangi jumlah record.

## 8. Rekomendasi Struktur Database

Periksa skema yang sudah ada terlebih dahulu. Reuse tabel jika fungsinya
sudah tersedia.

Struktur konseptual yang dapat digunakan:

### 8.1 `disaster_events`

Menyimpan satu record kejadian per identitas sumber yang telah
dinormalisasi.

Field konseptual:

-   `id`
-   `source_name`
-   `external_id` nullable
-   `identity_fingerprint`
-   `content_hash`
-   `category`
-   `title`
-   `description`
-   `event_time`
-   `latitude`
-   `longitude`
-   `geom` jika menggunakan PostGIS
-   `source_url` jika tersedia
-   `source_updated_at` jika tersedia
-   `first_seen_at`
-   `last_seen_at`
-   `created_at`
-   `updated_at`

Jangan membuat field atau tipe data baru secara membabi buta. Cocokkan
dengan model proyek yang sudah ada.

### 8.2 `data_sources`

Menyimpan konfigurasi dan metadata sumber API:

-   Nama sumber.
-   Status aktif.
-   Interval sinkronisasi.
-   Timeout dan retry.
-   Kapabilitas incremental.
-   Metadata konfigurasi non-secret.

Secret tetap dikelola melalui mekanisme konfigurasi aman yang sudah ada.

### 8.3 `sync_checkpoints`

Menyimpan checkpoint per sumber:

-   Source ID atau nama sumber.
-   Waktu sinkronisasi sukses terakhir.
-   Cursor atau timestamp terakhir jika didukung.
-   Status checkpoint.
-   Metadata tambahan.

### 8.4 `sync_logs`

Menyimpan ringkasan eksekusi sinkronisasi:

-   Source.
-   Start dan finish time.
-   Status.
-   Jumlah record yang diambil.
-   Jumlah valid.
-   Jumlah inserted.
-   Jumlah updated.
-   Jumlah unchanged/skipped.
-   Jumlah rejected.
-   Jumlah error.
-   Durasi.
-   Ringkasan error yang aman.

Jangan menyimpan seluruh payload API berulang kali ke tabel log. Jika
raw payload perlu disimpan untuk audit atau debugging, buat kebijakan
retensi dan penyimpanan terpisah.

### 8.5 `disaster_event_history` (opsional)

Gunakan hanya jika kebutuhan audit perubahan memang ada.

-   Simpan perubahan yang bermakna.
-   Jangan menambahkan snapshot identik pada setiap polling.
-   Terapkan retention policy yang jelas.
-   Pertimbangkan biaya storage sebelum mengaktifkannya.

## 9. Persistence Decision

Setiap record hasil normalisasi harus menghasilkan salah satu keputusan:

### INSERT

Dilakukan jika identitas kejadian belum ditemukan.

### UPDATE

Dilakukan jika identitas kejadian sudah ada dan content hash atau field
penting berubah.

### SKIP

Dilakukan jika identitas dan konten penting tidak berubah.

### REJECT

Dilakukan jika record tidak valid atau tidak cukup aman untuk diproses.

### REVIEW / AMBIGUOUS

Digunakan bila identitas tidak dapat ditentukan dengan confidence yang
memadai. Jangan otomatis menggabungkan atau menghapus data.

Simpan counter untuk setiap keputusan agar efisiensi sinkronisasi dapat
dipantau.

## 10. Transaction, Concurrency, dan Reliability

Implementasi harus memperhatikan:

-   Atomic transaction untuk persistence batch atau unit kerja yang
    sesuai.
-   Unique constraint di database sebagai perlindungan utama.
-   Upsert yang aman terhadap race condition.
-   Job lock per sumber agar scheduler tidak menjalankan job yang sama
    secara bersamaan.
-   Timeout untuk setiap request eksternal.
-   Retry terbatas untuk error sementara.
-   Exponential backoff dan jitter.
-   Hormati `Retry-After` ketika tersedia.
-   Circuit breaker jika pola kegagalan berulang membebani provider atau
    aplikasi.
-   Kegagalan satu provider tidak menghentikan provider lain.
-   Checkpoint tidak maju ketika batch belum sukses.
-   Log tidak boleh membocorkan token, API key, atau data rahasia.

Jangan melakukan retry tanpa batas. Bedakan error sementara, rate limit,
error autentikasi, dan error permanen.

## 11. Data Retention dan Pengendalian Database Growth

Deduplication mencegah duplikasi kejadian, tetapi database tetap
bertambah ketika ada kejadian baru atau perubahan yang perlu disimpan.

Buat kebijakan retensi yang terpisah untuk:

-   Data kejadian aktif.
-   Data kejadian historis.
-   Sync logs.
-   Raw payload (jika digunakan).
-   Event history.

Jangan menghapus kejadian lama hanya karena tidak muncul lagi pada
respons API terbaru. Tidak munculnya data pada satu respons bukan bukti
bahwa kejadian tersebut harus dihapus.

Rekomendasi:

-   Simpan kejadian historis sesuai kebutuhan analisis.
-   Retensi log sinkronisasi lebih pendek daripada data kejadian.
-   Hapus atau arsipkan raw payload berdasarkan kebijakan.
-   Jalankan cleanup sebagai job terpisah, terukur, dan dapat diaudit.
-   Jangan melakukan cleanup destruktif tanpa konfigurasi dan validasi.

## 12. Monitoring dan Observability

Sediakan ringkasan status sinkronisasi per sumber.

Metrik minimum:

-   Last successful sync.
-   Last attempted sync.
-   Current sync status.
-   Average duration.
-   Fetched count.
-   Inserted count.
-   Updated count.
-   Skipped count.
-   Rejected count.
-   Error count.
-   Retry count.
-   Rate-limit count.

Status yang disarankan:

-   `healthy`
-   `running`
-   `degraded`
-   `failed`
-   `disabled`

Status harus berasal dari hasil proses aktual, bukan nilai statis.

Sediakan log yang cukup untuk mengetahui mengapa sebuah record
di-insert, di-update, di-skip, atau ditolak.

## 13. Contoh Logika Upsert

Contoh SQL konseptual untuk sumber yang menyediakan external ID stabil:

``` sql
INSERT INTO disaster_events (
    source_name,
    external_id,
    title,
    event_time,
    latitude,
    longitude,
    content_hash
)
VALUES (
    :source_name,
    :external_id,
    :title,
    :event_time,
    :latitude,
    :longitude,
    :content_hash
)
ON CONFLICT (source_name, external_id)
DO UPDATE SET
    title = EXCLUDED.title,
    event_time = EXCLUDED.event_time,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    content_hash = EXCLUDED.content_hash,
    updated_at = NOW()
WHERE disaster_events.content_hash
      IS DISTINCT FROM EXCLUDED.content_hash;
```

Catatan:

-   Ini hanya contoh pola, bukan query yang boleh langsung diterapkan
    tanpa memeriksa skema aktual.
-   Pastikan unique constraint sesuai dengan data sumber.
-   Untuk external ID yang nullable, siapkan strategi fingerprint dan
    constraint yang sesuai.
-   Field parsial harus diperlakukan hati-hati agar nilai lama tidak
    tertimpa null yang tidak bermakna.
-   Jangan mengubah `updated_at` ketika record tidak berubah.

## 14. Testing Requirements

Buat atau perbarui automated tests untuk skenario berikut:

1.  Data baru menghasilkan satu INSERT.
2.  Payload identik pada polling berikutnya menghasilkan SKIP.
3.  Perubahan field penting menghasilkan UPDATE.
4.  Perubahan metadata polling saja tidak menghasilkan UPDATE kejadian.
5.  Dua polling bersamaan tidak membuat record ganda.
6.  External ID yang sama pada sumber berbeda tidak otomatis dianggap
    kejadian yang sama.
7.  Sumber tanpa external ID menggunakan fingerprint secara konsisten.
8.  Payload tidak valid ditolak tanpa menggagalkan seluruh batch.
9.  API timeout ditangani dengan retry terbatas.
10. API rate limit menghormati `Retry-After` jika tersedia.
11. Kegagalan batch tidak memajukan checkpoint secara keliru.
12. Data lama tidak terhapus hanya karena tidak muncul pada respons
    terbaru.
13. Field yang tidak ada dalam payload parsial tidak menimpa data lama
    dengan null.
14. Satu sumber gagal tidak menghentikan sinkronisasi sumber lain.
15. Proses sinkronisasi yang sama dapat dijalankan berulang kali dengan
    hasil database yang konsisten.

Gunakan test database atau mocking provider. Jangan mengirim request
berulang ke API produksi selama automated tests.

## 15. Implementation Workflow

Ikuti urutan kerja ini.

### Phase 1 --- Audit

-   Periksa struktur backend.
-   Identifikasi seluruh adapter/API collector.
-   Identifikasi scheduler atau job runner.
-   Periksa model dan tabel kejadian.
-   Periksa mekanisme insert/update saat ini.
-   Periksa API rate limit dan dokumentasi yang sudah tersedia.
-   Identifikasi sumber yang menyediakan external ID stabil.
-   Identifikasi sumber yang hanya menyediakan payload tanpa ID stabil.
-   Buat ringkasan temuan sebelum mengubah kode.

### Phase 2 --- Design

-   Rancang identitas kejadian per sumber.
-   Tentukan content hash fields.
-   Tentukan aturan normalization.
-   Tentukan checkpoint strategy per sumber.
-   Tentukan interval dan retry configuration.
-   Tentukan migration yang diperlukan.
-   Pastikan kompatibilitas dengan endpoint frontend.

### Phase 3 --- Implementation

-   Implementasikan atau refactor source adapter.
-   Implementasikan validation dan normalization.
-   Implementasikan deduplication.
-   Implementasikan change detection.
-   Implementasikan atomic upsert.
-   Implementasikan checkpoint.
-   Implementasikan job locking.
-   Implementasikan retry/backoff.
-   Implementasikan logging dan metrics.
-   Tambahkan retention job hanya jika diperlukan.

### Phase 4 --- Testing

-   Jalankan unit tests.
-   Jalankan integration tests.
-   Jalankan concurrency tests yang relevan.
-   Verifikasi tidak ada duplikasi.
-   Verifikasi perubahan data terdeteksi.
-   Verifikasi checkpoint dan retry.
-   Verifikasi endpoint lama tetap kompatibel.

### Phase 5 --- Documentation

Perbarui dokumentasi teknis yang relevan:

-   Diagram alur sinkronisasi.
-   Konfigurasi interval per sumber.
-   Aturan deduplication per sumber.
-   Field yang digunakan untuk identity fingerprint dan content hash.
-   Kebijakan retry dan rate limit.
-   Kebijakan retention.
-   Cara memantau status sinkronisasi.

## 16. Acceptance Criteria

Implementasi dinyatakan berhasil jika:

-   [ ] Setiap sumber memiliki aturan identitas kejadian yang jelas.
-   [ ] Record dengan identitas sumber dan konten sama tidak dibuat
    ulang.
-   [ ] Record baru disimpan satu kali.
-   [ ] Record yang berubah diperbarui secara aman.
-   [ ] Perubahan metadata polling tidak memicu update kejadian.
-   [ ] Sinkronisasi berulang bersifat idempotent.
-   [ ] Job yang berjalan bersamaan tidak membuat duplikasi.
-   [ ] Incremental retrieval digunakan hanya jika benar-benar didukung
    provider.
-   [ ] Checkpoint dikelola per sumber dan tidak maju pada batch gagal.
-   [ ] Rate limit dan retry ditangani dengan benar.
-   [ ] Kegagalan satu sumber tidak menghentikan sumber lain.
-   [ ] Data historis tidak dihapus secara tidak sengaja.
-   [ ] Log dan metrik sinkronisasi tersedia.
-   [ ] Tidak ada secret yang bocor ke log.
-   [ ] Endpoint dan kontrak data yang digunakan frontend tetap
    kompatibel.
-   [ ] Automated tests untuk skenario utama berhasil.

## 17. Output yang Harus Diberikan AI Coding Agent

Setelah pekerjaan selesai, berikan laporan berisi:

1.  Ringkasan arsitektur sinkronisasi sebelum perubahan.
2.  Masalah duplikasi yang ditemukan.
3.  Strategi identity dan deduplication untuk setiap sumber.
4.  Daftar file yang dibuat atau diubah.
5.  Daftar migration database yang dibuat.
6.  Interval polling dan alasan konfigurasi setiap sumber.
7.  Cara kerja INSERT, UPDATE, SKIP, dan REJECT.
8.  Hasil unit dan integration tests.
9.  Dampak terhadap kompatibilitas API frontend.
10. Risiko atau keterbatasan yang masih tersisa.

Jangan mengklaim fitur selesai jika belum diuji.

------------------------------------------------------------------------

## Prinsip Akhir

Nusantara Disaster harus memeriksa sumber data secara berkala sesuai
kebutuhan freshness dan batas provider, tetapi **tidak boleh menulis
ulang kejadian yang identik ke database pada setiap siklus polling**.

Gunakan kombinasi:

-   Source-scoped identity.
-   Deduplication.
-   Content hash change detection.
-   Idempotent upsert.
-   Incremental synchronization jika didukung.
-   Adaptive polling dan retry.
-   Checkpoint per sumber.
-   Observability dan retention policy.

**Hasil yang diharapkan:** data bencana tetap aktual, tidak terjadi
duplikasi record akibat polling berulang, perubahan informasi tetap
terdeteksi, dan pertumbuhan database lebih terkendali tanpa mengorbankan
keandalan sistem.
