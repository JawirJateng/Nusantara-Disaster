# Map Event Label Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tampilkan label nama bencana beranimasi di peta homepage saat marker atau kartu kejadian diklik.

**Architecture:** Satu `maplibregl.Popup` dipakai ulang sebagai wadah label. Konten React dirender lewat portal ke elemen popup, lalu dianimasikan dengan `motion/react`. `selectedEvent` yang sudah ada menjadi sumber posisi dan teks.

**Tech Stack:** Next.js 14, React 18, MapLibre GL, Motion for React, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-11-13-map-event-label-design.md`

## Global Constraints
- Frontend berjalan di Docker; dependency diinstal lewat `docker compose exec frontend`.
- Gunakan token desain yang ada; jangan menambah warna baru di luar skala Tailwind yang sudah dipakai.
- Tidak mengubah `frontend/src/app/page.tsx` atau halaman lain.
- Label harus `pointer-events-none` agar tidak menghalangi interaksi peta.

## Review Focus
- Koordinat 0 atau tidak valid tidak boleh membuat label muncul di lokasi salah.
- Perpindahan antar kejadian harus memicu animasi ulang, bukan label diam.
- Label harus tetap menempel saat peta di-pan/zoom.
- Judul panjang harus terpotong maksimal dua baris, tidak melebar keluar peta.

---

### Task 1: Tambah dependency Motion

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`

**Interfaces:**
- Produces: `motion/react` (`motion`, `AnimatePresence`) tersedia untuk Task 2.

- [ ] **Step 1: Install di container frontend**

Run:
```bash
docker compose exec frontend npm install motion
```
Expected: `motion` masuk ke `dependencies` dan package-lock berubah.

- [ ] **Step 2: Verifikasi paket terpasang**

Run:
```bash
docker compose exec frontend node -e "console.log(require('motion/package.json').version)"
```
Expected: versi Motion tercetak.

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore(frontend): add motion for map label animation"
```

---

### Task 2: Label bencana di MapLibreMap

**Files:**
- Modify: `frontend/src/components/MapLibreMap.tsx`

**Interfaces:**
- Consumes: `MapLibreMap` props `{ events, onSelectEvent, selectedEvent }`; `selectedEvent` berisi `id`, `title`, `category`, `latitude`, `longitude`.
- Produces: label visual; tidak ada API baru.

- [ ] **Step 1: Tambah import dan state**

Tambahkan:
```tsx
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
```
Di dalam komponen:
```tsx
const [labelContainer] = useState(() => document.createElement('div'));
const labelPopupRef = useRef<maplibregl.Popup | null>(null);
```
`useState` sudah diimpor.

- [ ] **Step 2: Buat popup di effect inisialisasi peta**

Setelah `mapInstance.current = map;`:
```tsx
const labelPopup = new maplibregl.Popup({
  closeButton: false,
  closeOnClick: false,
  anchor: 'bottom',
  offset: 26,
  maxWidth: '280px',
});
labelPopup.setDOMContent(labelContainer);
labelPopupRef.current = labelPopup;
```
Di cleanup effect, tambahkan:
```tsx
labelPopup.remove();
labelPopupRef.current = null;
```

- [ ] **Step 3: Tampilkan dan pindahkan label**

Tambahkan effect setelah effect marker:
```tsx
useEffect(() => {
  const popup = labelPopupRef.current;
  const map = mapInstance.current;
  if (!popup || !map || !selectedEvent || !mapLoaded) return;

  const lat = Number(selectedEvent.latitude);
  const lng = Number(selectedEvent.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  popup.setLngLat([lng, lat]).addTo(map);
}, [selectedEvent, mapLoaded]);
```

- [ ] **Step 4: Render konten label lewat portal**

Di dalam `return`, setelah `<div ref={mapContainer} ... />`:
```tsx
{selectedEvent &&
  createPortal(
    <motion.div
      key={selectedEvent.id}
      initial={{ opacity: 0, y: 8, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className="pointer-events-none relative w-max max-w-[260px] origin-bottom rounded-card border border-line bg-surface/95 px-3 py-2 shadow-floating backdrop-blur-sm"
    >
      <div className="flex items-start gap-2">
        <span
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
            {
              EARTHQUAKE: 'bg-red-600',
              VOLCANO: 'bg-rose-600',
              FLOOD: 'bg-blue-600',
              LANDSLIDE: 'bg-amber-600',
              WILDFIRE: 'bg-orange-600',
              WEATHER: 'bg-indigo-600',
            }[detectCategory(selectedEvent)] || 'bg-slate-500'
          }`}
        />
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-ink">
          {selectedEvent.title}
        </p>
      </div>
      <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-line bg-surface" />
    </motion.div>,
    labelContainer
  )}
```

- [ ] **Step 5: Type-check**

Run:
```bash
docker compose exec frontend npx tsc --noEmit
```
Expected: tidak ada error.

- [ ] **Step 6: Build**

Run:
```bash
docker compose exec frontend npm run build
```
Expected: build sukses. Jika build mengganggu dev server, hentikan frontend dulu, build, lalu `docker compose up -d frontend`.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/MapLibreMap.tsx
git commit -m "feat(frontend): show animated disaster label on map selection"
```

---

### Task 3: Verifikasi perilaku

- [ ] **Step 1: Cek halaman merespons**

Run:
```bash
curl -s -o NUL -w "%{http_code}" http://localhost:3000
```
Expected: `200`.

- [ ] **Step 2: Verifikasi manual di browser**

Buka `http://localhost:3000`, lalu:
1. Klik satu ikon bencana di peta → label judul muncul di atas ikon.
2. Klik kartu kejadian di panel kiri → peta zoom dan label muncul di lokasi yang sama.
3. Klik kejadian lain → label berpindah dan beranimasi ulang.
4. Pan/zoom peta → label tetap menempel pada titik.
Expected: semua sesuai.
