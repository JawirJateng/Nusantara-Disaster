import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ShieldAlert, Info, CheckCircle2 } from 'lucide-react';

export default function TentangPage() {
  return (
    <div className="min-h-full flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tentang Nusantara Disaster</h1>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Misi & Visi</h2>
            <p>
              Nusantara Disaster memiliki visi untuk menjadi platform pemantauan dan informasi kebencanaan Indonesia yang terintegrasi, informatif, dan mudah diakses oleh masyarakat. Melalui pemanfaatan teknologi geospasial serta integrasi berbagai sumber data terpercaya, kami berupaya meningkatkan aksesibilitas informasi dan menyajikan visualisasi persebaran bencana secara akurat serta transparan. Kami berkomitmen menyediakan informasi kebencanaan yang mendukung peningkatan literasi, kesadaran, dan kesiapsiagaan masyarakat dalam menghadapi berbagai potensi bencana di seluruh wilayah Indonesia.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Sumber Data</h2>
            <p>
              Nusantara Disaster mengintegrasikan pembaruan otomatis dan data real-time dari berbagai sumber resmi berikut:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-600">
              <li><strong>BMKG</strong> — Badan Meteorologi, Klimatologi, dan Geofisika</li>
              <li><strong>BNPB</strong> — Badan Nasional Penanggulangan Bencana</li>
              <li><strong>PVMBG</strong> — Pusat Vulkanologi dan Mitigasi Bencana Geologi</li>
              <li><strong>MAGMA Indonesia</strong> — Multiplatform Application for Geohazard Mitigation and Assessment</li>
              <li><strong>PetaBencana.id</strong> — PetaBencana</li>
              <li><strong>NASA FIRMS</strong> — National Aeronautics and Space Administration, Fire Information for Resource Management System</li>
              <li><strong>CNN Indonesia</strong></li>
              <li><strong>detikcom</strong></li>
              <li><strong>Tempo.co</strong></li>
              <li><strong>ANTARA News</strong></li>
            </ol>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
