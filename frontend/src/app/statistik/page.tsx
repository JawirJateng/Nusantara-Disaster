'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { fetchAPI } from '@/lib/api';
import ReactECharts from 'echarts-for-react';
import { BarChart3, ShieldAlert, Activity, Database } from 'lucide-react';

export default function StatistikPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPI('/analytics/summary')
      .then((res) => setSummary(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const categoryOption = {
    title: { text: 'Distribusi Kategori Bencana', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item' },
    xAxis: {
      type: 'category',
      data: summary?.categoryCounts?.map((c: any) => c.category) || [],
      axisLabel: { interval: 0, rotate: 20, fontSize: 10 },
    },
    yAxis: { type: 'value' },
    series: [
      {
        data: summary?.categoryCounts?.map((c: any) => c.count) || [],
        type: 'bar',
        itemStyle: { color: '#ef4444' },
      },
    ],
  };

  const provinceOption = {
    title: { text: '10 Provinsi dengan Kejadian Tertinggi', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: summary?.provinceCounts?.map((p: any) => p.province).reverse() || [],
      axisLabel: { fontSize: 10 },
    },
    series: [
      {
        data: summary?.provinceCounts?.map((p: any) => p.count).reverse() || [],
        type: 'bar',
        itemStyle: { color: '#3b82f6' },
      },
    ],
  };

  return (
    <div className="min-h-full flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analisis & Statistik Kebencanaan</h1>
          <p className="text-xs text-slate-600 mt-1">
            Ringkasan data analitik komprehensif berdasarkan laporan multi-sumber nasional.
          </p>
        </div>

        {/* KPI Cards */}
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
            <span className="text-xs text-slate-500 font-medium">Sumber Terintegrasi</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">{summary?.kpis?.sourcesCount || 5} Instansi</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <ReactECharts option={categoryOption} style={{ height: '350px' }} />
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <ReactECharts option={provinceOption} style={{ height: '350px' }} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
