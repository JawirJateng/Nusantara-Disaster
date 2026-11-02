'use client';

import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { ShieldAlert, Plus, Trash2, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminKejadianPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    try {
      const res = await fetchAPI('/events?limit=100');
      setEvents(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus kejadian ini dari platform?')) return;
    try {
      await fetchAPI(`/events/${id}`, { method: 'DELETE' });
      loadEvents();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await fetchAPI(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ verificationStatus: 'VERIFIED' }),
      });
      loadEvents();
    } catch (err: any) {
      alert(err.message || 'Gagal verifikasi');
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
          <Link href="/admin/kejadian" className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg bg-slate-800 text-white">
            <span>Kelola Kejadian</span>
          </Link>
          <Link href="/admin/sumber" className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
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
            <h1 className="text-2xl font-bold text-slate-900">Kelola Kejadian Bencana</h1>
            <p className="text-xs text-slate-600 mt-1">Moderasi, verifikasi, dan hapus catatan kejadian bencana.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <th className="p-4 font-bold">Kategori</th>
                <th className="p-4 font-bold">Judul Kejadian</th>
                <th className="p-4 font-bold">Wilayah</th>
                <th className="p-4 font-bold">Verifikasi</th>
                <th className="p-4 font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono font-bold uppercase">{ev.category}</td>
                  <td className="p-4 font-bold text-slate-900">{ev.title}</td>
                  <td className="p-4 text-slate-600">{ev.province}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      ev.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {ev.verificationStatus}
                    </span>
                  </td>
                  <td className="p-4 flex items-center space-x-2">
                    {ev.verificationStatus !== 'VERIFIED' && (
                      <button
                        onClick={() => handleVerify(ev.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-[11px]"
                      >
                        Verifikasi
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-medium text-[11px]"
                    >
                      Hapus
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
