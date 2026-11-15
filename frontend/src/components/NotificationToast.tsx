'use client';

import React, { useEffect, useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';

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
      const timerIn = setTimeout(() => setShow(true), 50);
      const timerOut = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300);
      }, 10000);

      return () => {
        clearTimeout(timerIn);
        clearTimeout(timerOut);
      };
    }
  }, [event, onClose]);

  if (!event) return null;

  const severity = (event.severity || '').toUpperCase();
  let badgeClass = 'bg-warning/15 text-warning border-warning/30';
  if (severity === 'CRITICAL') {
    badgeClass = 'bg-danger/15 text-danger border-danger/30';
  } else if (severity === 'HIGH') {
    badgeClass = 'bg-warning/15 text-warning border-warning/30';
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-surface text-ink rounded-card shadow-floating border border-line max-w-sm transition-all duration-300 ease-out transform ${
        show ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
      }`}
    >
      <div className="p-4 flex items-start space-x-3">
        <div className="bg-danger/10 p-2 rounded-button text-danger shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-danger uppercase tracking-wider">
              Peringatan Bencana Baru
            </span>
            <button
              onClick={() => {
                setShow(false);
                setTimeout(onClose, 300);
              }}
              className="text-ink-muted hover:text-ink transition-colors"
              aria-label="Tutup peringatan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h4 className="font-bold text-sm leading-snug text-ink truncate">{event.title}</h4>
          <p className="text-body-sm text-ink-muted truncate">{event.locationName} ({event.province})</p>
          <button
            onClick={() => {
              onView(event);
              setShow(false);
              setTimeout(onClose, 300);
            }}
            className="text-body-sm font-semibold text-sage-400 hover:text-sage-300 pt-1 block"
          >
            Periksa di Peta →
          </button>
        </div>
      </div>
    </div>
  );
}