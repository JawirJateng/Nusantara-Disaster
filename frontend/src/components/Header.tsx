'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, Radio, Info, Menu } from 'lucide-react';

export function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="container mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center group min-w-0">
          <div className="truncate">
            <span className="font-bold text-sm sm:text-base md:text-lg tracking-wide block leading-tight truncate">NUSANTARA DISASTER</span>
            <span className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 tracking-wider uppercase truncate block">MENGENALI ANCAMAN, MELINDUNGI MASA DEPAN</span>
          </div>
        </Link>

        {/* Center: Desktop Inline Navigation Links (hidden on mobile, shown on lg+) */}
        <nav className="hidden lg:flex items-center space-x-2 text-xs font-semibold">
          <Link
            href="/"
            className="px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors flex items-center space-x-1.5"
          >
            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>Peta Utama</span>
          </Link>
          <Link
            href="/kejadian"
            className="px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors flex items-center space-x-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
            <span>Daftar Bencana</span>
          </Link>
          <Link
            href="/tentang"
            className="px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors flex items-center space-x-1.5"
          >
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Tentang</span>
          </Link>
        </nav>

        {/* Right side: Live Sync Indicator & Mobile Hamburger Menu */}
        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
          <div className="hidden lg:flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-full text-xs text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Sinkronisasi Live Aktif</span>
          </div>

          {/* Mobile/Tablet Hamburger Menu Dropdown (shown on screens smaller than lg) */}
          <div className="relative lg:hidden" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all duration-200 flex items-center justify-center focus:outline-none shadow-sm"
              title="Menu Navigasi"
            >
              <Menu className="w-5 h-5 text-slate-200" />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 transform origin-top-right transition-all duration-300 animate-in fade-in zoom-in-95 text-xs">
                <div className="px-4 py-2 border-b border-slate-700/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Navigasi Utama
                </div>
                <div className="p-1.5 space-y-1">
                  <Link
                    href="/"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-700 text-slate-200 hover:text-white transition-colors font-medium"
                  >
                    <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                    <span>Peta Utama</span>
                  </Link>
                  <Link
                    href="/kejadian"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-700 text-slate-200 hover:text-white transition-colors font-medium"
                  >
                    <ShieldAlert className="w-4 h-4 text-orange-400" />
                    <span>Daftar Bencana</span>
                  </Link>
                  <Link
                    href="/tentang"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-700 text-slate-200 hover:text-white transition-colors font-medium"
                  >
                    <Info className="w-4 h-4 text-blue-400" />
                    <span>Tentang Platform</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
