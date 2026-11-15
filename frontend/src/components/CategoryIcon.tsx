import React from 'react';
import { detectCategory } from '@/lib/formatters';

interface CategoryIconProps {
  eventOrCat: any;
  className?: string;
}

export function CategoryIcon({ eventOrCat, className = 'w-5 h-5' }: CategoryIconProps) {
  const upper = detectCategory(eventOrCat);

  // SVG-based icons using Lucide-style approach (no emojis)
  const icons: Record<string, React.ReactNode> = {
    EARTHQUAKE: (
      <svg className={`text-danger inline-block shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <title>Gempa Bumi</title>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    VOLCANO: (
      <svg className={`text-rose-600 inline-block shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <title>Gunung Api</title>
        <path d="M12 22v-5" />
        <path d="M12 22v-5" />
        <path d="M17 18a5 5 0 0 0-10 0" />
        <path d="M17 18a5 5 0 0 0-10 0" />
        <path d="M17 18a5 5 0 0 0-10 0" />
        <path d="M17 18a5 5 0 0 0-10 0" />
        <path d="M12 2v2" />
        <path d="M12 9l-1.5 1.5" />
        <path d="M15.5 12.5l-1.5 1.5" />
        <path d="M18 15l-1.5-1.5" />
        <path d="M18 9l1.5 1.5" />
      </svg>
    ),
    FLOOD: (
      <svg className={`text-blue-600 inline-block shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <title>Banjir</title>
        <path d="M2 16c0 4.5 3.5 8 8 8s8-3.5 8-8" />
        <path d="M2 20c0-4.5 3.5-8 8-8s8 3.5 8 8" />
        <path d="M10 2c0 4.5-3.5 8-8 8S2 6.5 2 2s3.5-8 8-8 8 3.5 8 8" />
        <path d="M22 10c0 4.5-3.5 8-8 8" />
        <path d="M6 14c0 2.5 2 4.5 4.5 4.5" />
        <path d="M18 14c0 2.5-2 4.5-4.5 4.5" />
      </svg>
    ),
    LANDSLIDE: (
      <svg className={`text-amber-600 inline-block shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <title>Tanah Longsor</title>
        <path d="M10 2v2" />
        <path d="M14 2v2" />
        <path d="M6 6h12" />
        <path d="M6 10h12" />
        <path d="M6 14h12" />
        <path d="M6 18h12" />
        <path d="M4 22h16" />
        <path d="M10 22v-4" />
        <path d="M14 22v-4" />
      </svg>
    ),
    WILDFIRE: (
      <svg className={`text-orange-600 inline-block shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <title>Kebakaran</title>
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    ),
    WEATHER: (
      <svg className={`text-indigo-600 inline-block shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <title>Cuaca Ekstrem</title>
        <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.4" />
        <path d="M12 2v2m4.93 1.07l-1.42 1.42M20 12h2m-1.07 4.93l-1.42-1.42M16 16.5A4.5 4.5 0 0 1 7.5 14a5 5 0 0 1 9.25-2.25" />
        <path d="M19 18H5a3 3 0 0 1 0-6 4 4 0 0 1 7.4-1.8" />
      </svg>
    ),
    DEFAULT: (
      <svg className={`text-slate-500 inline-block shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <title>Bencana Lainnya</title>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </svg>
    ),
  };

  const key = icons[upper] ? upper : 'DEFAULT';
  return icons[key];
}