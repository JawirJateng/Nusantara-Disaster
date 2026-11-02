import React from 'react';
import { detectCategory } from '@/lib/formatters';

interface CategoryIconProps {
  eventOrCat: any;
  className?: string;
}

export function CategoryIcon({ eventOrCat, className = 'w-5 h-5' }: CategoryIconProps) {
  const upper = detectCategory(eventOrCat);

  switch (upper) {
    case 'EARTHQUAKE':
    case 'GEMPA':
      return (
        /* Image 2: Red pulse / waveform seismograph icon */
        <svg className={`text-red-600 inline-block shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <title>Gempa Bumi</title>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case 'VOLCANO':
    case 'GUNUNG_API':
    case 'ERUPSI':
      return <span className={`inline-flex items-center justify-center ${className}`} title="Gunung Api">🌋</span>;
    case 'FLOOD':
    case 'BANJIR':
      return <span className={`inline-flex items-center justify-center ${className}`} title="Banjir">🌊</span>;
    case 'LANDSLIDE':
    case 'LONGSOR':
      return <span className={`inline-flex items-center justify-center ${className}`} title="Tanah Longsor">🪨</span>;
    case 'WILDFIRE':
    case 'FIRE':
    case 'KEBAKARAN':
    case 'KARHUTLA':
      return <span className={`inline-flex items-center justify-center ${className}`} title="Kebakaran">🔥</span>;
    case 'WEATHER':
    case 'CUACA':
    case 'EXTREME_WEATHER':
      return (
        /* Image 1: Slate-blue weather icon showing sun rising behind cloud on light grayish-blue background */
        <div className={`rounded-xl bg-slate-200/90 flex items-center justify-center p-1 shadow-sm inline-flex shrink-0 ${className}`} title="Cuaca Ekstrem">
          <svg className="w-full h-full text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <title>Cuaca Ekstrem</title>
            <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.4" />
            <path d="M12 2v2m4.93 1.07l-1.42 1.42M20 12h2m-1.07 4.93l-1.42-1.42M16 16.5A4.5 4.5 0 0 1 7.5 14a5 5 0 0 1 9.25-2.25" />
            <path d="M19 18H5a3 3 0 0 1 0-6 4 4 0 0 1 7.4-1.8" />
          </svg>
        </div>
      );
    default:
      return <span className={`inline-flex items-center justify-center ${className}`} title="Bencana Lainnya">⚠️</span>;
  }
}
