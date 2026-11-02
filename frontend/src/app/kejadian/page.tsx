'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { EventDetailModal } from '@/components/EventDetailModal';
import { fetchAPI } from '@/lib/api';
import { translateCategory, translateSeverity } from '@/lib/formatters';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Search, MapPin } from 'lucide-react';

export default function KejadianPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [severity, setSeverity] = useState('ALL');
  const [province, setProvince] = useState('');
  const [limit, setLimit] = useState(10);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    try {
      setLoading(true);
      let query = `/events?limit=${limit}`;
      if (category !== 'ALL') query += `&category=${category}`;
      if (severity !== 'ALL') query += `&severity=${severity}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (province) query += `&province=${encodeURIComponent(province)}`;

      const res = await fetchAPI(query);
      setEvents(res.items || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [category, severity, province, limit]);

  return (
    <div className="min-h-full flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daftar Bencana Indonesia</h1>
          <p className="text-xs text-slate-600 mt-1">
            Arsip lengkap kejadian bencana alam yang dilaporkan oleh BMKG, BNPB, PVMBG, dan instansi resmi lainnya.
          </p>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari lokasi, judul, atau wilayah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadEvents()}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="ALL">Semua Kategori Bencana</option>
            <option value="EARTHQUAKE">Gempa Bumi</option>
            <option value="VOLCANO">Gunung Api</option>
            <option value="FLOOD">Banjir</option>
            <option value="LANDSLIDE">Tanah Longsor</option>
            <option value="WILDFIRE">Kebakaran</option>
            <option value="WEATHER">Cuaca Ekstrem</option>
          </select>

          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="ALL">Semua Tingkat Keparahan</option>
            <option value="CRITICAL">Kritis / Darurat</option>
            <option value="HIGH">Tinggi</option>
            <option value="MODERATE">Sedang</option>
            <option value="LOW">Rendah</option>
          </select>

          <button
            onClick={loadEvents}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm"
          >
            Terapkan Filter
          </button>
        </div>

        {/* Events Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <th className="p-4 font-bold">Kategori</th>
                  <th className="p-4 font-bold">Kejadian</th>
                  <th className="p-4 font-bold">Lokasi / Wilayah</th>
                  <th className="p-4 font-bold">Keparahan</th>
                  <th className="p-4 font-bold">Waktu</th>
                  <th className="p-4 font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      {loading ? 'Memuat data kejadian...' : 'Tidak ada kejadian yang ditemukan.'}
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => (
                    <tr
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <CategoryIcon eventOrCat={ev} className="w-5 h-5" />
                          <span className="px-2.5 py-1 rounded bg-slate-100 font-semibold text-slate-800 uppercase text-[10px]">
                            {translateCategory(ev)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-900 max-w-xs">{ev.title}</td>
                      <td className="p-4 text-slate-600">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>{ev.locationName} ({ev.province})</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded font-bold text-[10px] ${
                          ev.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                          ev.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {translateSeverity(ev.severity)}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-mono text-[11px]">
                        {new Date(ev.occurredAt).toLocaleString('id-ID')}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(ev);
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-medium transition-colors"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Limit Selector at the Bottom */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              Menampilkan <span className="font-semibold text-slate-900">{events.length}</span> data kejadian bencana
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-600 font-medium">Tampilkan per halaman:</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white font-medium text-slate-800 shadow-sm"
              >
                <option value="5">5 Bencana</option>
                <option value="10">10 Bencana</option>
                <option value="25">25 Bencana</option>
                <option value="50">50 Bencana</option>
                <option value="100">100 Bencana</option>
              </select>
            </div>
          </div>
        </div>
      </main>

      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      <Footer />
    </div>
  );
}
