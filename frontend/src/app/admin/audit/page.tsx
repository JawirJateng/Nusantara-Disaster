'use client';

import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPI('/audit')
      .then((res) => setLogs(res.items || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

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
          <Link href="/admin/sumber" className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
            <span>Sumber Data & Sync</span>
          </Link>
          <Link href="/admin/audit" className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg bg-slate-800 text-white">
            <span>Audit Log</span>
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Audit Log Aktivitas Sistem</h1>
            <p className="text-xs text-slate-600 mt-1">Rekam jejak seluruh tindakan administratif dan perubahan data.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <th className="p-4 font-bold">Waktu</th>
                <th className="p-4 font-bold">Administrator</th>
                <th className="p-4 font-bold">Aksi</th>
                <th className="p-4 font-bold">Entitas</th>
                <th className="p-4 font-bold">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono text-slate-500 text-[11px]">
                    {new Date(log.createdAt).toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 font-semibold text-slate-900">{log.user?.name || 'Sistem / Automated'}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-mono font-bold text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-600">{log.entityType}</td>
                  <td className="p-4 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                    {JSON.stringify(log.details)}
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
