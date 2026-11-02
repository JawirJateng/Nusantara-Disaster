'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { fetchAPI } from '@/lib/api';
import { Database, ShieldCheck, CheckCircle2, Clock, ExternalLink } from 'lucide-react';

export default function SumberPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPI('/sources')
      .then((res) => setSources(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-full flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sumber Data & Integrasi Resmi</h1>
          <p className="text-xs text-slate-600 mt-1">
            Daftar lembaga pemerintah dan layanan internasional penyedia data multi-bencana di Nusantara Disaster.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sources.map((src) => (
            <div key={src.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-mono text-xs font-bold">
                    {src.code}
                  </span>
                  <span className={`flex items-center space-x-1.5 text-xs font-semibold ${
                    src.isEnabled ? 'text-emerald-600' : 'text-slate-400'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{src.isEnabled ? 'Aktif' : 'Nonaktif'}</span>
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{src.name}</h3>
                <div className="text-xs text-slate-500 space-y-1">
                  <p>Interval Polling: Setiap {src.pollIntervalMinutes} menit</p>
                  <p>Total Kejadian: {src._count?.events || 0} terekam</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Sync: {src.lastSyncAt ? new Date(src.lastSyncAt).toLocaleTimeString('id-ID') : 'Belum pernah'}</span>
                </span>
                <span className="font-semibold text-emerald-600">{src.lastSyncStatus || 'READY'}</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
