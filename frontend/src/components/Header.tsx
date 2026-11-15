'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NDWLogo } from '@/components/NDWLogo';
import { cn } from '@/lib/utils';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Removed 'Statistik' from public navLinks as requested
  const navLinks = [
    { href: '/', label: 'Peta Utama' },
    { href: '/kejadian', label: 'Daftar Bencana' },
    { href: '/tentang', label: 'Tentang' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-forest-900/95 backdrop-blur-md text-surface border-b border-forest-800/50 shadow-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Brand/Logo Section */}
        <Link href="/" className="flex items-center space-x-3 group min-w-0 transition-opacity hover:opacity-90">
          <NDWLogo className="w-10 h-10" />
          <div className="min-w-0">
            <span className="font-bold text-sm sm:text-lg tracking-tight block leading-none text-white truncate">
              NUSANTARA DISASTER
            </span>
            <span className="text-[9px] sm:text-[10px] text-sage-400 font-medium tracking-wider uppercase mt-1 block truncate">
              Monitoring Bencana Nasional
            </span>
          </div>
        </Link>

        {/* Desktop Navigation - Optimized for Laptop/Desktop (No Statistik for public) */}
        <nav className="hidden md:flex items-center bg-forest-950/40 rounded-full border border-forest-800/30 p-1 mx-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 text-center",
                  isActive
                    ? "bg-forest-700 text-white shadow-sm"
                    : "text-sage-400 hover:text-white hover:bg-forest-800/50"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Section */}
        <div className="flex items-center space-x-3">
          {/* Live Indicator (Desktop) */}
          <div className="hidden lg:flex items-center space-x-2 bg-mint-100/10 px-3 py-1.5 rounded-full text-[11px] font-bold text-mint-100 border border-mint-100/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sage-400"></span>
            </span>
            <span className="uppercase tracking-widest text-[10px]">LIVE</span>
          </div>

          {/* Admin Access Link */}
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="text-sage-400 hover:text-white hover:bg-forest-800 rounded-full" title="Portal Administrator">
              <Settings2 className="w-5 h-5" />
            </Button>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2.5 bg-forest-800 hover:bg-forest-700 text-surface rounded-full transition-colors border border-forest-700/50"
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-forest-900 border-b border-forest-800 shadow-floating animate-in slide-in-from-top-4 duration-200 overflow-hidden">
          <div className="container mx-auto px-4 py-6 space-y-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex items-center p-4 rounded-xl text-base font-semibold transition-colors",
                    isActive
                      ? "bg-forest-700 text-white"
                      : "text-sage-400 hover:bg-forest-800 hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-4 mt-4 border-t border-forest-800/50 flex items-center justify-between px-4">
              <span className="text-xs font-bold text-sage-400 uppercase tracking-widest text-[10px]">LIVE STATUS</span>
              <div className="flex items-center space-x-2 text-[11px] text-mint-100">
                <span className="w-1.5 h-1.5 rounded-full bg-sage-400 slow-pulse" />
                <span>ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}