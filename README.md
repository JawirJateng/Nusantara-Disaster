<div align="center">

# 🇮🇩 Nusantara Disaster (NDW)
### **Platform Informasi & Pemantauan Bencana Indonesia Terintegrasi Real-Time**

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS-red?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20PostGIS-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Deployment-Docker-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

*Mengenali Ancaman, Melindungi Masa Depan.*

</div>

---

## 🌟 Tentang Platform

**Nusantara Disaster** adalah platform nasional open-source yang dirancang untuk mengkonsolidasikan data multi-bencana dari berbagai lembaga resmi dan media kredibel di Indonesia. Dengan memanfaatkan teknologi geospasial real-time, platform ini menyajikan peta interaktif dan laporan kejadian yang akurat untuk mendukung kesiapsiagaan masyarakat dan mitigasi darurat.

---

## 📊 Sumber Data Resmi Terintegrasi

Platform ini secara otomatis menyelaraskan dan memvalidasi data dari 10 sumber resmi:

1. **BMKG** — Badan Meteorologi, Klimatologi, dan Geofisika
2. **BNPB** — Badan Nasional Penanggulangan Bencana
3. **PVMBG** — Pusat Vulkanologi dan Mitigasi Bencana Geologi
4. **MAGMA Indonesia** — Multiplatform Application for Geohazard Mitigation and Assessment
5. **PetaBencana.id** — PetaBencana
6. **NASA FIRMS** — National Aeronautics and Space Administration, Fire Information for Resource Management System
7. **CNN Indonesia**
8. **detikcom**
9. **Tempo.co**
10. **ANTARA News**

---

## 🚀 Fitur Utama

- 🗺️ **Peta Interaktif Geospasial**: Visualisasi titik sebaran gempa, gunung api, banjir, dan cuaca ekstrem secara real-time menggunakan MapLibre GL.
- 📋 **Daftar & Arsip Bencana**: Akses lengkap daftar kejadian bencana dengan filter kategori, tingkat keparahan, wilayah, dan pilihan jumlah tampilan dinamis (5 hingga 100 per halaman).
- 📰 **Berita Bencana Alam**: Agregasi berita terkini dari media terpercaya yang diformat khusus untuk informasi kebencanaan.
- 📱 **Desain Responsif**: Tata letak adaptif yang optimal diakses melalui desktop maupun perangkat seluler (*mobile-friendly*).
- 🔄 **Sinkronisasi Otomatis**: Layanan *cron job* backend yang memperbarui data bencana setiap 1 menit secara otomatis.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, MapLibre GL, Lucide Icons.
- **Backend**: NestJS, TypeScript, Prisma ORM, Node.js.
- **Database & Cache**: PostgreSQL (PostGIS) & Redis.
- **Containerization**: Docker & Docker Compose.

---

## ⚙️ Menjalankan Proyek Secara Lokal

Pastikan Anda telah menginstal [Docker](https://www.docker.com/) dan Node.js pada komputer Anda.

1. **Clone repository ini:**
   ```bash
   git clone https://github.com/JawirJateng/Nusantara-Disaster.git
   cd Nusantara-Disaster
   ```

2. **Jalankan layanan menggunakan Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Akses aplikasi di browser:**
   - **Frontend**: `http://localhost:3000`
   - **Backend API**: `http://localhost:4000`

---

## 📄 Lisensi

Distribusi di bawah lisensi **MIT**. Lihat file `LICENSE` untuk informasi lebih lanjut.

---
<div align="center">
  <i>Dibangun dengan ❤️ untuk keselamatan dan kesiapsiagaan bangsa Indonesia.</i>
</div>
