import React from 'react';

export function NDWLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <div className={`${className} bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 relative overflow-hidden border border-red-400/40 shrink-0`}>
      {/* Concentric seismic circles in background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
        <div className="w-8 h-8 rounded-full border border-white" />
        <div className="absolute w-5 h-5 rounded-full border border-white" />
      </div>
      {/* Seismograph zigzag wave SVG */}
      <svg className="w-5 h-5 text-white relative z-10 drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="2 12 6 12 8 5 11 19 14 9 16 15 19 12 22 12" />
      </svg>
    </div>
  );
}
