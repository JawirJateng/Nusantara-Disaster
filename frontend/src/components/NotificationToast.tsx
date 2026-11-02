'use client';

import React, { useEffect, useState } from 'react';
import { Bell, X, ShieldAlert } from 'lucide-react';

interface ToastProps {
  event: any | null;
  onView: (ev: any) => void;
  onClose: () => void;
}

export function NotificationToast({ event, onView, onClose }: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (event) {
      setShow(false);
      const timerIn = setTimeout(() => setShow(true), 50); // smooth slide-in
      const timerOut = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300);
      }, 10000); // Auto dismiss after 10 seconds

      return () => {
        clearTimeout(timerIn);
        clearTimeout(timerOut);
      };
    }
  }, [event, onClose]);

  if (!event) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl border border-red-500/50 flex items-start space-x-4 max-w-sm transition-all duration-500 ease-out transform ${
        show ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
      }`}
    >
      <div className="bg-red-600/20 p-2.5 rounded-xl text-red-500 shrink-0 mt-0.5">
        <ShieldAlert className="w-5 h-5" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">🚨 Peringatan Bencana Baru</span>
          <button
            onClick={() => {
              setShow(false);
              setTimeout(onClose, 300);
            }}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <h4 className="font-bold text-xs leading-snug text-slate-100">{event.title}</h4>
        <p className="text-[11px] text-slate-400">{event.locationName} ({event.province})</p>
        <button
          onClick={() => {
            onView(event);
            setShow(false);
            setTimeout(onClose, 300);
          }}
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 pt-1 block"
        >
          Periksa di Peta &rarr;
        </button>
      </div>
    </div>
  );
}
