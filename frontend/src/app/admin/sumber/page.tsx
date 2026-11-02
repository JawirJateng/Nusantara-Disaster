'use client';

import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { Database, RefreshCw, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminSumberPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSources = async () => {
    try {
      const res = await fetchAPI('/sources');
      setSources(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleSync = async (id: string) => {
    try {
      await fetchAPI(`/sources/${id}/sync`, { method: 'POST' });
      alert('Sinkronisasi berhasil dipicu!');
      loadSources();
    } catch (err: any) {
      alert(err.message || 'Gagal sinkronisasi');
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await fetchAPI(`/sources/${id}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ isEnabled: !currentStatus }),
      });
      loadSources();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <span className="text-xs font-bold text-red-500 tracking-wider block uppercase">NDW Control Center</span>
          <span className="text-white font-bold text-base block mt-0.5">Admin Dashboard</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 text-xs font-medium">
          <Link href="/admin" className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
            <span>Ringkasan Sistem</span>
          </Link>
          <Link href="/admin/kejadian" className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
            <span>Kelola Kejadian</span>
          </Link>
          <Link href="/admin/sumber" className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg bg-slate-800 text-white">
            <span>Sumber Data & Sync</span>
          </Link>
          <Link href="/admin/audit" className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
            <span>Audit Log</span>
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kelola Sumber Data & Konektor</h1>
            <p className="text-xs text-slate-600 mt-1">Konfigurasi interval polling dan trigger sinkronisasi manual.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <th className="p-4 font-bold">Kode</th>
                <th className="p-4 font-bold">Nama Sumber</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Terakhir Sync</th>
                <th className="p-4 font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map((src) => (
                <tr key={src.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono font-bold">{src.code}</td>
                  <td className="p-4 font-semibold text-slate-900">{src.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      src.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {src.isEnabled ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-500 text-[11px]">
                    {src.lastSyncAt ? new Date(src.lastSyncAt).toLocaleString('id-ID') : 'Belum pernah'}
                  </td>
                  <td className="p-4 flex items-center space-x-2">
                    <button
                      onClick={() => handleSync(src.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium text-[11px] flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sync Sekarang</span>
                    </button>
                    <button
                      onClick={() => handleToggle(src.id, src.isEnabled)}
                      className={`px-3 py-1.5 rounded font-medium text-[11px] ${
                        src.isEnabled ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                    >
                      {src.isEnabled ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
