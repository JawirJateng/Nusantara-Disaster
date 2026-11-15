# Error & Resolution Log: Sinkronisasi Ikon & Titik Lokasi Bencana pada Peta

**Tanggal:** 2 November 2026  
**Modul Terdampak:** `MapLibreMap.tsx`, `formatters.ts`, `events.service.ts`  
**Status:** Terselesaikan (*Resolved*)

---

## 1. Deskripsi Masalah (Bug Description)
Pengguna melaporkan dua masalah utama pada peta interaktif Nusantara Disaster Watch:
1. **Ketidaksesuaian Ikon Bencana:** Ikon yang dirender pada penanda (*marker*) peta menggunakan simbol umum (`⚠️` atau tidak sesuai jenis bencana) alih-alih simbol spesifik bencana (Gempa, Gunung Berapi, Banjir, Longsor, Kebakaran, Cuaca Ekstrem).
2. **Ketidakakuratan Posisi Titik Lokasi (*Marker Offset*):** Posisi ikon pada peta bergeser dari titik koordinat aslinya akibat adanya algoritma *offset* penumpukan koordinat sebelumnya, sehingga letak ikon tidak akurat dengan lokasi geografis kejadian bencana.

---

## 2. Analisis Akar Masalah (Root Cause Analysis)
- **Kategori Bencana & Pemetaan Ikon:** Data kejadian bencana (*disaster events*) dari sumber atau database terkadang memiliki kategori umum (`OTHER`) atau tidak memiliki nilai kategori eksplisit. Switch-case lama di komponen peta hanya mengandalkan nilai `ev.category` mentah tanpa verifikasi kata kunci.
- **Pergeseran Koordinat (*Offset*):** Kode perenderan marker sebelumnya menerapkan perhitungan radius radial (`lat += radius * Math.cos(angle); lng += radius * Math.sin(angle)`) untuk mencegah penumpukan marker pada koordinat yang sama. Hal ini menyebabkan marker bergeser dari titik lat/lng aktualnya.

---

## 3. Langkah Perbaikan & Solusi (*Remediation Steps*)
1. **Implementasi Deteksi Cerdas (*Smart Category Detection*):**
   - Menambahkan fungsi `detectCategory(eventOrCat)` di `formatters.ts` yang secara otomatis mendeteksi kategori bencana berdasarkan analisis kata kunci pada judul (`title`), deskripsi (`description`), lokasi (`locationName`), wilayah (`regency`), dan provinsi (`province`).
   - Memetakan alias dan sinonim bahasa Indonesia ke kategori standar internasional:
     - Gempa Bumi (`EARTHQUAKE`, `GEMPA`, `SEISMIK`): `💥`
     - Gunung Api / Erupsi (`VOLCANO`, `GUNUNG_API`, `ERUPSI`, `VULKANIK`): `🌋`
     - Banjir (`FLOOD`, `BANJIR`, `GENANGAN`, `ROB`): `🌊`
     - Tanah Longsor (`LANDSLIDE`, `LONGSOR`): `🪨`
     - Kebakaran Hutan & Lahan (`WILDFIRE`, `KARHUTLA`, `KEBAKARAN`, `HOTSPOT`): `🔥`
     - Cuaca Ekstrem (`WEATHER`, `CUACA`, `CUACA_EKSTREM`): `⚡`
   - Memperbaiki seluruh komponen UI ([page.tsx](file:///D:/Vscode/Mega%20Project/frontend/src/app/page.tsx), [kejadian/page.tsx](file:///D:/Vscode/Mega%20Project/frontend/src/app/kejadian/page.tsx), [EventDetailModal.tsx](file:///D:/Vscode/Mega%20Project/frontend/src/components/EventDetailModal.tsx), [EventDetailDrawer.tsx](file:///D:/Vscode/Mega%20Project/frontend/src/components/EventDetailDrawer.tsx), [EventListModal.tsx](file:///D:/Vscode/Mega%20Project/frontend/src/components/EventListModal.tsx)) agar mem-pass seluruh objek `event` ke `getCategoryIcon` dan `translateCategory`.

2. **Penghapusan *Offset* Koordinat & Penyetelan Titik Jangkar Presisi:**
   - Menghapus rumus pergeseran radial di `MapLibreMap.tsx` sehingga setiap marker di-render **tepat pada titik koordinat lintang (*latitude*) dan bujur (*longitude*) aslinya**.
   - Mengubah `anchor: 'bottom'` menjadi `anchor: 'center'` pada `maplibregl.Marker` badge bundar, sehingga titik pusat simbol tepat bertumpu pada koordinat lokasi sebenarnya.
   - Menambahkan interactive hover popup & tooltip informasi lokasi pada setiap marker penanda peta.

3. **Pengaturan Titik Pusat Peta (*Center & Viewport*):**
   - Mengatur titik pusat peta (*center*) sesuai titik tengah geografis resmi Indonesia: **`[118.0150, -2.5489]`** (Longitude: 118.0° · Latitude: -2.5°).

---

## 4. Hasil Pengujian (*Verification*)
- Seluruh 12 unit test case pemetaan ikon dan kategori lolos (*PASS*).
- Build frontend Next.js berhasil dengan sukses (*Compiled successfully* tanpa error tipe).
- Server produksi dan container berjalan stabil dengan status HTTP 200 OK.
- Seluruh penanda ikon pada peta, daftar kejadian, dan modal detail kini tampil akurat dan tepat pada koordinat lokasi kejadian.
