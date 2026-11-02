'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, ShieldAlert, ChevronRight } from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { translateCategory, translateSeverity } from '@/lib/formatters';
import { CategoryIcon } from '@/components/CategoryIcon';

interface EventListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEvent: (ev: any) => void;
}

export function EventListModal({ isOpen, onClose, onSelectEvent }: EventListModalProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [severity, setSeverity] = useState('ALL');
  const [loading, setLoading] = useState(false);

  const loadEvents = async () => {
    try {
      setLoading(true);
      let query = '/events?limit=100';
      if (category !== 'ALL') query += `&category=${category}`;
      if (severity !== 'ALL') query += `&severity=${severity}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;

      const res = await fetchAPI(query);
      setEvents(res.items || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadEvents();
    }
  }, [isOpen, category, severity]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Wide Horizontal Rectangle Modal */}
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-6 h-6 text-orange-400" />
            <div>
              <h2 className="text-base font-bold text-white">Arsip Daftar Kejadian Bencana Indonesia</h2>
              <p className="text-[11px] text-slate-400">Daftar lengkap laporan multi-bencana dari berbagai instansi resmi.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari lokasi, judul, atau wilayah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadEvents()}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
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
            className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="ALL">Semua Tingkat Keparahan</option>
            <option value="CRITICAL">Kritis / Darurat</option>
            <option value="HIGH">Tinggi</option>
            <option value="MODERATE">Sedang</option>
            <option value="LOW">Rendah</option>
          </select>
        </div>

        {/* Events Table / List Body */}
        <div className="p-4 overflow-y-auto flex-1 bg-white">
          {events.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              {loading ? 'Memuat data kejadian...' : 'Tidak ada kejadian yang ditemukan.'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => {
                    onClose();
                    onSelectEvent(ev);
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-between group shadow-xs text-xs"
                >
                  <div className="flex items-center space-x-3 max-w-xl">
                    <CategoryIcon eventOrCat={ev} className="w-6 h-6 shrink-0" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 uppercase">
                          {translateCategory(ev)}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          ev.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 animate-pulse' :
                          ev.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {translateSeverity(ev.severity)}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 mt-1 group-hover:text-blue-600 transition-colors leading-snug">
                        {ev.title}
                      </h4>
                      <div className="flex items-center space-x-1.5 text-slate-500 text-[11px] mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span className="truncate">{ev.locationName} ({ev.province})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(ev.occurredAt).toLocaleDateString('id-ID')}
                    </span>
                    <button className="px-3 py-1.5 bg-slate-900 group-hover:bg-blue-600 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center space-x-1">
                      <span>Detail</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {events.length} kejadian bencana</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-semibold transition-colors shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
