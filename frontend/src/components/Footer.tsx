import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-10 text-sm">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-white font-bold text-base mb-3">Nusantara Disaster</h3>
          <p className="text-xs leading-relaxed">
            Platform informasi dan pemantauan bencana Indonesia yang mengintegrasikan data geospasial untuk menghadirkan informasi kebencanaan yang informatif, transparan, dan mudah diakses.
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Navigasi Cepat</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/" className="hover:text-white transition-colors">Peta Interaktif</Link></li>
            <li><Link href="/kejadian" className="hover:text-white transition-colors">Daftar Kejadian Bencana</Link></li>
            <li><Link href="/tentang" className="hover:text-white transition-colors">Tentang Platform</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Kesiapsiagaan Darurat</h4>
          <p className="text-xs leading-relaxed mb-3">
            Layanan darurat nasional bebas pulsa: <strong className="text-white">112</strong> (Call Center Darurat Indonesia).
          </p>
          <div className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Nusantara Disaster (v1 beta)
          </div>
        </div>
      </div>
    </footer>
  );
}
