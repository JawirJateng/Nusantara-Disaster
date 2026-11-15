'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { NDWLogo } from '@/components/NDWLogo';

const QUICK_LINKS = [
  { href: '/', label: 'Peta Utama' },
  { href: '/kejadian', label: 'Daftar Bencana' },
  { href: '/tentang', label: 'Tentang' },
];

export function Footer() {
  const pathname = usePathname();

  const handleQuickLink = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname !== href) return;
    event.preventDefault();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <footer className="bg-forest-950 text-surface border-t border-forest-800 py-12 text-sm">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <NDWLogo className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" />
            <h3 className="text-surface font-bold text-base tracking-wide">Nusantara Disaster</h3>
          </div>
          <p className="text-xs leading-relaxed text-surface/70 max-w-xs">
            Platform informasi dan pemantauan bencana Indonesia yang mengintegrasikan data geospasial untuk menghadirkan informasi kebencanaan yang informatif, transparan, dan mudah diakses.
          </p>
        </div>
        <div>
          <ul className="space-y-2 text-xs">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={(event) => handleQuickLink(event, link.href)}
                  className="text-surface/80 hover:text-mint-100 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-surface font-semibold mb-3 text-sm">Kesiapsiagaan Darurat</h4>
          <p className="text-xs leading-relaxed text-surface/80 mb-3">
            Layanan darurat nasional bebas pulsa: <strong className="text-surface">112</strong> (Call Center Darurat Indonesia).
          </p>
          <div className="text-xs text-surface/50">
            &copy; {new Date().getFullYear()} Nusantara Disaster (v1 beta)
          </div>
        </div>
      </div>
    </footer>
  );
}