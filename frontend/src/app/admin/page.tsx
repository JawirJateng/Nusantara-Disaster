'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { ShieldAlert, Database, Users, ShieldCheck, Lock, LogOut, RefreshCw, Activity, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AdminOverviewPage() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('admin@ndw.go.id');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const profile = await fetchAPI('/auth/me');
      setUser(profile);
      loadAdminData();
    } catch {
      setUser(null);
    }
  };

  const loadAdminData = async () => {
    try {
      const [sumRes, srcRes] = await Promise.all([
        fetchAPI('/analytics/summary'),
        fetchAPI('/sources'),
      ]);
      setSummary(sumRes);
      setSources(srcRes);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('ndw_token', res.accessToken);
      setUser(res.user);
      loadAdminData();
    } catch (err: any) {
      setError(err.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ndw_token');
    setUser(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="bg-red-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto text-white shadow-lg">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white">Admin Dashboard NDW</h1>
            <p className="text-xs text-slate-400">Masuk dengan kredensial administrator berwenang.</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-200 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Administrator</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Kata Sandi</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-red-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors shadow-lg"
            >
              {loading ? 'Memproses...' : 'Masuk Dashboard Admin'}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
              &larr; Kembali ke Peta Publik
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <span className="text-xs font-bold text-red-500 tracking-wider block uppercase">NDW Control Center</span>
          <span className="text-white font-bold text-base block mt-0.5">Admin Dashboard</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 text-xs font-medium">
          <Link href="/admin" className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg bg-slate-800 text-white">
            <Activity className="w-4 h-4 text-red-500" />
            <span>Ringkasan Sistem</span>
          </Link>
          <Link href="/admin/kejadian" className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <ShieldAlert className="w-4 h-4" />
            <span>Kelola Kejadian</span>
          </Link>
          <Link href="/admin/sumber" className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Database className="w-4 h-4" />
            <span>Sumber Data & Sync</span>
          </Link>
          <Link href="/admin/audit" className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Log</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="px-3 py-2 bg-slate-800/60 rounded-lg text-xs">
            <span className="text-slate-400 block">Masuk sebagai</span>
            <span className="text-white font-bold truncate block">{user.name}</span>
            <span className="text-[10px] text-red-400 uppercase font-mono">{user.role}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-red-600 text-white rounded-lg text-xs transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Area */}
      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ringkasan Sistem & Kesehatan Konektor</h1>
            <p className="text-xs text-slate-600 mt-1">Pantau status sinkronisasi data real-time dan metrik operasional.</p>
          </div>
          <button
            onClick={loadAdminData}
            className="flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold shadow-sm text-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Segarkan</span>
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Total Kejadian Terekam</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{summary?.kpis?.totalEvents || 0}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Bencana Status Aktif</span>
            <div className="text-2xl font-bold text-red-600 mt-1">{summary?.kpis?.activeEvents || 0}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Terverifikasi Resmi</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{summary?.kpis?.verifiedEvents || 0}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Konektor Aktif</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">{summary?.kpis?.sourcesCount || 5}</div>
          </div>
        </div>

        {/* Sources Health Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Status Konektor Sumber Data</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <th className="p-3 font-bold">Kode</th>
                  <th className="p-3 font-bold">Nama Sumber</th>
                  <th className="p-3 font-bold">Status Konektor</th>
                  <th className="p-3 font-bold">Sinkronisasi Terakhir</th>
                  <th className="p-3 font-bold">Status Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sources.map((src) => (
                  <tr key={src.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-800">{src.code}</td>
                    <td className="p-3 font-semibold text-slate-900">{src.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        src.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {src.isEnabled ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {src.lastSyncAt ? new Date(src.lastSyncAt).toLocaleString('id-ID') : 'Belum pernah'}
                    </td>
                    <td className="p-3 font-semibold text-emerald-600">{src.lastSyncStatus || 'READY'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
