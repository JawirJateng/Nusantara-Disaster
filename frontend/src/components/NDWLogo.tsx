import React from 'react';

export function NDWLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <div className={`${className} bg-sage-400 text-forest-950 rounded-md flex items-center justify-center shadow-md shrink-0 font-bold border border-sage-300`}>
      <svg className="w-5 h-5 text-forest-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="2 12 6 12 8 5 11 19 14 9 16 15 19 12 22 12" />
      </svg>
    </div>
  );
}