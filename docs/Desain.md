# DESAIN.md --- Nusantara Disaster

> Panduan visual dan implementasi antarmuka untuk website monitoring
> bencana alam di Indonesia. Dokumen ini menjadi acuan Claude Code saat
> membangun atau memperbarui UI menggunakan Tailwind CSS.

## 1. Arah desain

Bangun antarmuka **modern, minimalis, informatif, dan berorientasi pada
kejelasan informasi**. Referensi visual menggunakan palet hijau gelap
hingga hijau pucat pada gambar yang diberikan.

Karakter desain: - Tenang dan tepercaya, tetapi tetap tegas ketika
menampilkan informasi darurat. - Mengutamakan peta, status kejadian,
waktu pembaruan, dan sumber data. - Hierarki informasi jelas; pengguna
harus bisa memahami situasi dalam beberapa detik. - Gunakan ruang kosong
yang cukup, garis pemisah halus, radius konsisten, dan bayangan
lembut. - Hindari tampilan dashboard generik, dekorasi berlebihan,
gradien di setiap kartu, glassmorphism berlebihan, emoji sebagai ikon
utama, dan animasi yang tidak memiliki fungsi.

**Prinsip utama:** informasi bencana harus mudah dipindai, mudah
diverifikasi, dan tidak menimbulkan kepanikan yang tidak perlu.

## 2. Palet warna

Gunakan enam warna dari referensi sebagai design tokens utama.

  Token          Hex         Peran
  -------------- ----------- -------------------------------------------
  `forest-950`   `#051F20`   Latar sangat gelap, sidebar gelap, footer
  `forest-900`   `#0B2B26`   Header gelap, permukaan sekunder gelap
  `forest-800`   `#163832`   Elemen navigasi aktif, panel gelap
  `forest-700`   `#235347`   Tombol utama, aksen, tautan aktif
  `sage-400`     `#8EB69B`   Aksen lembut, ikon sekunder, border aktif
  `mint-100`     `#DAF1DE`   Latar lembut, highlight, permukaan terang

### Warna pendukung antarmuka

Warna berikut melengkapi palet, bukan menggantikannya: - `surface`:
`#FFFFFF` - `canvas`: `#F7FAF7` - `text-primary`: `#172522` -
`text-secondary`: `#60716A` - `border`: `#E2EAE4` - `danger`:
`#C43D3D` - `warning`: `#C58A28` - `info`: `#3478A5` - `success`:
`#2F7658`

Warna status bahaya, peringatan, dan informasi harus tetap mudah
dibedakan. Jangan menggunakan hijau sebagai satu-satunya penanda tingkat
bahaya.

### Gradien

Gunakan gradien hijau hanya untuk area dekoratif yang luas dan tidak
berisi informasi kritis.

``` css
background: linear-gradient(
  180deg,
  #DAF1DE 0%,
  #8EB69B 28%,
  #235347 62%,
  #0B2B26 82%,
  #051F20 100%
);
```

Jangan menerapkan gradien ini pada seluruh kartu atau setiap tombol.
Permukaan konten utama sebaiknya solid agar data tetap mudah dibaca.

## 3. Tipografi

Gunakan sans-serif modern dengan karakter netral dan keterbacaan tinggi.

Rekomendasi: - **Inter** sebagai pilihan utama. - Alternatif:
`ui-sans-serif`, `system-ui`, sans-serif. - Gunakan font monospace hanya
untuk koordinat, kode kejadian, atau data teknis.

Skala tipografi: - Judul halaman: 28--36 px, weight 650--700. - Judul
bagian: 18--22 px, weight 600. - Judul kartu: 14--16 px, weight 600. -
Isi: 14--16 px, weight 400. - Label dan metadata: 12--13 px. - Angka
KPI: 28--36 px, weight 650--700.

Gunakan line-height yang nyaman. Hindari terlalu banyak variasi ukuran
dan ketebalan font.

## 4. Bentuk, jarak, dan elevasi

-   Radius kartu: 14--18 px.
-   Radius tombol dan input: 9--12 px.
-   Radius badge: pill.
-   Jarak antarbagian: 24--32 px.
-   Padding kartu: 18--24 px.
-   Border: 1 px solid `#E2EAE4`.
-   Shadow: tipis dan lembut, hanya untuk memisahkan lapisan.

Contoh shadow:

``` css
box-shadow: 0 8px 24px rgba(5, 31, 32, 0.06);
```

Hindari shadow hitam pekat, outline tebal, dan radius yang berbeda-beda
tanpa alasan.

## 5. Struktur dan navigasi website

### Area publik

Pengunjung tidak perlu login untuk melihat informasi bencana.

Navigasi desktop yang disarankan: 1. Logo dan nama **Nusantara
Disaster**. 2. Beranda. 3. Peta Bencana. 4. Data dan Statistik. 5.
Informasi dan Edukasi. 6. Tentang. 7. Tombol masuk khusus administrator.

Pada layar kecil, ubah navigasi menjadi menu mobile yang ringkas.
Pastikan akses ke peta dan daftar kejadian tetap mudah ditemukan.

### Dashboard publik

Susunan halaman beranda: 1. **Header** --- identitas, navigasi, dan
status pembaruan data. 2. **Hero** --- ringkasan situasi kebencanaan
nasional dan ajakan membuka peta. 3. **Ringkasan statistik** --- jumlah
kejadian, kejadian aktif, wilayah terdampak, dan data korban jika
tersedia. 4. **Peta interaktif Indonesia** --- visualisasi lokasi
kejadian dengan legenda yang jelas. 5. **Kejadian terbaru** --- daftar
kejadian berdasarkan waktu pembaruan. 6. **Sebaran dan tren** --- grafik
kejadian menurut jenis bencana atau periode. 7. **Sumber data** ---
transparansi lembaga penyedia data. 8. **Footer** --- informasi
platform, metodologi, dan tautan penting.

Jangan menampilkan angka contoh seolah-olah merupakan data aktual. Jika
API belum tersedia, gunakan data dummy yang diberi label jelas seperti
"Data simulasi".

### Halaman peta bencana

-   Peta menjadi elemen utama dan mendapat ruang paling besar.
-   Sediakan filter jenis bencana, rentang waktu, provinsi, dan tingkat
    dampak.
-   Marker dibedakan berdasarkan kategori bencana dan status, dengan
    legenda yang selalu dapat diakses.
-   Klik marker membuka panel detail kejadian.
-   Panel detail memuat nama kejadian, lokasi, waktu kejadian, waktu
    pembaruan, status, ringkasan dampak, dan sumber data.
-   Sediakan tampilan daftar sebagai alternatif peta.
-   Tampilkan keadaan loading, data kosong, dan kegagalan memuat data.

### Detail kejadian

Tampilkan informasi secara terstruktur: - Nama dan kategori bencana. -
Lokasi administratif. - Koordinat bila tersedia. - Waktu kejadian dan
pembaruan terakhir. - Tingkat atau status kejadian sesuai data sumber. -
Dampak dan korban hanya jika datanya tersedia dan terverifikasi. -
Kronologi atau pembaruan. - Sumber resmi dan tautan rujukan.

Jangan menyimpulkan tingkat bahaya sendiri jika sumber tidak menyediakan
klasifikasi tersebut.

### Dashboard administrator

Area admin harus terpisah secara visual dari halaman publik dan
dilindungi autentikasi serta otorisasi.

Elemen utama: - Sidebar navigasi. - Header dengan profil dan kontrol
akun. - Ringkasan kondisi data. - Manajemen kejadian bencana. -
Manajemen kategori dan wilayah. - Manajemen sumber data. - Manajemen
pengguna dan role. - Pengaturan website. - Log aktivitas administrator.

Aksi tambah, ubah, hapus, dan publikasi harus memiliki konfirmasi yang
sesuai. Catat perubahan penting pada log aktivitas. Terapkan validasi di
sisi klien dan server.

## 6. Komponen UI

### Tombol

-   Primary: latar `forest-700`, teks putih.
-   Secondary: latar `mint-100`, teks `forest-900`.
-   Outline: latar transparan, border `sage-400`, teks `forest-800`.
-   Danger: gunakan warna `danger` hanya untuk tindakan destruktif.

Semua tombol harus memiliki hover, focus, active, disabled, dan loading
state.

### Kartu

Gunakan latar putih, border halus, radius konsisten, dan padding
memadai. Kartu statistik harus menonjolkan angka, lalu label dan
keterangan periode. Jangan membuat setiap kartu menggunakan warna latar
berbeda.

### Badge status

Gunakan label teks bersama warna: - Aktif. - Selesai. - Dalam
pemantauan. - Belum diverifikasi. - Data simulasi.

Jangan mengandalkan warna saja untuk menyampaikan status.

### Form dan tabel

-   Label form harus selalu terlihat.
-   Berikan pesan validasi yang spesifik.
-   Tabel memiliki header jelas, alignment angka konsisten, dan dukungan
    overflow horizontal pada mobile.
-   Sediakan pencarian, filter, sorting, pagination, serta empty state
    bila relevan.

### Ikon

Gunakan satu keluarga ikon yang konsisten, misalnya Lucide. Utamakan
ikon sederhana dan mudah dikenali. Berikan label atau accessible name
untuk tombol ikon.

## 7. Penerapan dengan Tailwind CSS

Gunakan utility class Tailwind untuk styling komponen. Hindari menumpuk
class yang saling bertentangan atau membuat nilai warna acak di banyak
file.

### Jika proyek menggunakan Tailwind CSS v4

Definisikan token pada file CSS utama:

``` css
@import "tailwindcss";

@theme {
  --color-forest-950: #051F20;
  --color-forest-900: #0B2B26;
  --color-forest-800: #163832;
  --color-forest-700: #235347;
  --color-sage-400: #8EB69B;
  --color-mint-100: #DAF1DE;

  --color-canvas: #F7FAF7;
  --color-ink: #172522;
  --color-muted: #60716A;
  --color-line: #E2EAE4;

  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

  --radius-card: 1rem;
}
```

Contoh penggunaan:

``` html
<main class="min-h-screen bg-canvas font-sans text-ink">
  <section class="rounded-card border border-line bg-white p-6 shadow-sm">
    <p class="text-sm text-muted">Kejadian aktif</p>
    <p class="mt-2 text-3xl font-semibold text-forest-900">—</p>
  </section>
</main>
```

### Jika proyek menggunakan Tailwind CSS v3

Masukkan warna yang sama ke `theme.extend.colors` pada
`tailwind.config.js` atau `tailwind.config.ts`. Jangan memasang
konfigurasi v3 ke proyek v4 tanpa memeriksa struktur proyek terlebih
dahulu.

**Instruksi untuk Claude Code:** sebelum mengubah konfigurasi, periksa
versi Tailwind, package manager, struktur folder, dan file CSS entry
point yang sudah digunakan. Pertahankan konfigurasi proyek yang masih
valid.

## 8. Responsivitas

Gunakan pendekatan mobile-first.

-   Mobile: satu kolom, navigasi ringkas, kartu statistik bertumpuk,
    panel peta dapat berubah menjadi bottom sheet.
-   Tablet: dua kolom untuk statistik dan konten yang sesuai.
-   Desktop: manfaatkan ruang lebar untuk peta, sidebar, tabel, dan
    panel detail.
-   Hindari fixed width yang menyebabkan horizontal scroll.
-   Pastikan kontrol peta tetap dapat digunakan dengan sentuhan.

Breakpoint Tailwind standar dapat digunakan (`sm`, `md`, `lg`, `xl`,
`2xl`) kecuali proyek sudah memiliki breakpoint khusus.

## 9. Motion dan interaksi

Animasi harus singkat, halus, dan fungsional: - Transisi hover sekitar
150--200 ms. - Gunakan skeleton untuk loading konten. - Gunakan animasi
kecil untuk membuka panel atau dropdown. - Hindari parallax, animasi
latar terus-menerus, efek berputar, dan gerakan yang mengganggu
pembacaan data. - Hormati preferensi `prefers-reduced-motion`.

## 10. Aksesibilitas dan kepercayaan data

-   Pastikan kontras teks memenuhi WCAG 2.1 AA sebisa mungkin.
-   Semua fungsi utama dapat diakses dengan keyboard.
-   Tampilkan focus ring yang jelas.
-   Gunakan semantic HTML dan heading secara berurutan.
-   Berikan alternatif teks untuk informasi visual penting pada peta dan
    grafik.
-   Cantumkan sumber dan waktu pembaruan data.
-   Bedakan data real-time, data tertunda, data arsip, dan data
    simulasi.
-   Jangan menyebut data "real-time" jika sumber hanya diperbarui secara
    berkala.
-   Jangan mengarang data korban, koordinat, status, atau peringatan.

## 11. Aturan implementasi untuk Claude Code

Saat mengerjakan UI, ikuti urutan berikut:

1.  Baca `DESAIN.md`, `PRD.md`, `package.json`, dan struktur proyek
    sebelum mengubah kode.
2.  Identifikasi versi Tailwind dan framework yang benar-benar
    digunakan.
3.  Audit komponen yang sudah ada. Reuse komponen yang baik dan hindari
    duplikasi.
4.  Buat design tokens terpusat untuk warna, radius, shadow, dan
    tipografi.
5.  Implementasikan layout responsif dengan komponen yang reusable.
6.  Pastikan halaman publik tetap dapat diakses tanpa login; batasi
    halaman admin melalui autentikasi dan role.
7.  Gunakan data dari API atau sumber yang sudah ditentukan. Jangan
    mengganti integrasi data dengan angka fiktif.
8.  Sediakan loading, error, empty, dan success state.
9.  Uji tampilan pada mobile, tablet, dan desktop.
10. Jalankan lint, type-check, dan build sesuai script yang tersedia di
    `package.json`.

### Batasan kualitas

-   Jangan mengubah arsitektur, dependency, atau konfigurasi inti tanpa
    alasan teknis.
-   Jangan menambahkan library hanya untuk efek dekoratif sederhana.
-   Jangan membuat semua bagian menjadi kartu.
-   Jangan menggunakan emoji sebagai pengganti ikon antarmuka.
-   Jangan menambahkan teks lorem ipsum atau data bencana palsu yang
    tampak nyata.
-   Jangan mengorbankan keterbacaan demi tampilan visual.
-   Jangan menghapus fitur yang sudah berjalan saat melakukan redesign.

## 12. Kriteria hasil akhir

Desain dianggap sesuai jika: - Palet hijau referensi digunakan
konsisten. - Tampilan bersih, modern, minimalis, dan tidak terasa
seperti template dashboard generik. - Peta dan informasi kejadian
menjadi fokus utama. - Status, sumber, serta waktu pembaruan data mudah
ditemukan. - Halaman publik dan admin memiliki hierarki yang jelas. -
Layout berfungsi baik pada mobile hingga desktop. - Komponen memiliki
state interaksi dan aksesibilitas yang memadai. - Seluruh data yang
ditampilkan dapat ditelusuri sumbernya atau diberi label sebagai
simulasi.

------------------------------------------------------------------------

**Arahan akhir:** jadikan dokumen ini sebagai design system dan batasan
visual proyek. Jika ada konflik antara dokumen ini dan implementasi
teknis yang sudah berjalan, pertahankan fungsionalitas serta arsitektur
yang benar, lalu sesuaikan visualnya tanpa merusak fitur.
