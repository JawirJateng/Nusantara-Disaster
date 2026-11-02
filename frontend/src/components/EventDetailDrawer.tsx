'use client';

import React from 'react';
import { X, MapPin, Calendar, ShieldCheck, AlertTriangle, ExternalLink } from 'lucide-react';
import { translateCategory, translateSeverity, translateMetadataKey, translateMetadataValue } from '@/lib/formatters';

interface DrawerProps {
  event: any | null;
  onClose: () => void;
}

export function EventDetailDrawer({ event, onClose }: DrawerProps) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-y-auto border-l border-slate-200">
        {/* Top Header: Disaster Type at top, styled nicely without emoji icon */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="bg-slate-800/90 px-4 py-2 rounded-xl border border-slate-700/60 shadow-inner">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-100">
              {translateCategory(event)}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Title & Severity Level Below */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-bold shadow-xs inline-flex items-center space-x-1.5 ${
                event.severity === 'CRITICAL' ? 'bg-red-600 text-white animate-pulse' :
                event.severity === 'HIGH' ? 'bg-orange-600 text-white' : 'bg-amber-600 text-white'
              }`}>
                <span>Tingkat:</span>
                <span className="uppercase tracking-wider">{translateSeverity(event.severity)}</span>
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 leading-snug">{event.title}</h2>
            <div className="flex items-center space-x-2 text-slate-500 text-xs">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{new Date(event.occurredAt).toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-slate-700">Lokasi:</span>
                <p className="text-slate-900 font-medium mt-0.5">{event.locationName}</p>
                <p className="text-slate-500 mt-0.5">{event.regency}, {event.province}</p>
              </div>
            </div>

            {event.source && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
                <span className="text-slate-500">Sumber Resmi:</span>
                <span className="font-semibold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-xs">
                  {event.source.name}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Deskripsi Kejadian</h3>
            <p className="text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200">
              {event.description || 'Tidak ada deskripsi tambahan.'}
            </p>
          </div>

          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Parameter & Metrik Teknis</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                {Object.entries(event.metadata).map(([key, val]: [string, any]) => (
                  <div key={key} className="bg-white p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">{translateMetadataKey(key)}</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">{translateMetadataValue(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 space-y-1">
              <span className="font-bold block">Status Verifikasi Resmi</span>
              <p className="text-blue-700">
                Kejadian ini telah diverifikasi melalui sistem integrasi multi-sumber resmi Nusantara Disaster.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">ID: {event.externalId || event.id}</span>
        </div>
      </div>
    </div>
  );
}
