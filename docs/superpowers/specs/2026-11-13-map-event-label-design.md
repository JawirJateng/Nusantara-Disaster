# Map Event Label — Design

## Intent
Menampilkan nama bencana sebagai label beranimasi di peta homepage saat pengguna mengklik ikon bencana atau kartu kejadian di panel kiri.

## Goals
- Label muncul dan menempel pada koordinat kejadian terpilih.
- Animasi masuk/keluar halus memakai Motion for React.
- Label mengikuti pan/zoom peta.
- Klik kejadian lain memindahkan label.

## Non-goals
- Tidak menutup label saat peta kosong diklik.
- Tidak mengubah halaman statistik, daftar kejadian, atau admin.
- Tidak menambah konten detail (deskripsi/metadata) di dalam label.

## Constraints
- Frontend berjalan di Docker; dependency baru harus diinstal di container.
- Gunakan token desain yang sudah ada (`surface`, `line`, `ink`, `forest`, dsb.).
- `selectedEvent` yang sudah ada di homepage menjadi satu-satunya sumber state.

## Approaches
1. **Motion + MapLibre Popup (dipilih)** — konten React dirender lewat portal ke dalam satu `maplibregl.Popup`. MapLibre mengurus posisi saat pan/zoom; Motion memberi animasi masuk/keluar.
2. **CSS animation saja** — tanpa dependency, tetapi animasi keluar dan spring tidak sehalus Motion.

## Short Design
- Tambah dependency `motion` (`motion/react`).
- Di `MapLibreMap.tsx`, buat satu `maplibregl.Popup` dengan anchor `bottom` dan offset di atas ikon, lalu pindahkan ke koordinat `selectedEvent`.
- Render portal React ke elemen popup: `AnimatePresence` + `motion.div` dengan spring fade/slide/scale.
- Isi label: judul bencana, maksimal dua baris, aksen warna kategori, `pointer-events-none`.
- Effect memindahkan marker ke `selectedEvent.latitude/longitude` setiap pilihan berubah.
- Tidak ada perubahan pada `page.tsx`.

## Verification
- Klik marker → label muncul di atas marker dan peta zoom.
- Klik kartu kiri → label muncul di lokasi yang sama.
- Klik kejadian lain → label berpindah dengan animasi.
- Pan/zoom → label tetap menempel.
- `npm run build` frontend lolos.
