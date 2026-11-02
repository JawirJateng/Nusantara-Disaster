'use client';

import React from 'react';
import { X, MapPin, Calendar, ShieldCheck, AlertTriangle } from 'lucide-react';
import { translateCategory, translateSeverity, translateMetadataKey, translateMetadataValue } from '@/lib/formatters';
import { CategoryIcon } from '@/components/CategoryIcon';

interface ModalProps {
  event: any | null;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: ModalProps) {
  if (!event) return null;

  const severity = (event.severity || '').toUpperCase();
  let badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
  if (severity === 'CRITICAL') {
    badgeClass = 'bg-red-100 text-red-800 border-red-200 animate-pulse';
  } else if (severity === 'HIGH') {
    badgeClass = 'bg-orange-100 text-orange-800 border-orange-200';
  }

  const impactText = event.metadata?.impact || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Persegi Panjang Horizontal Container */}
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <CategoryIcon eventOrCat={event} className="w-8 h-8 shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 uppercase tracking-wider">
                  {translateCategory(event)}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider ${badgeClass}`}>
                  {translateSeverity(event.severity)}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-1 leading-snug">{event.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Wide Horizontal 2-Column Rectangle */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
          
          {/* Left Column (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center space-x-2 text-slate-500">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{new Date(event.occurredAt).toLocaleString('id-ID')}</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700">Lokasi Kejadian:</span>
                  <p className="text-slate-900 font-medium mt-0.5">{event.locationName}</p>
                  <p className="text-slate-500 mt-0.5">{event.regency}, {event.province}</p>
                </div>
              </div>

              {event.source && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <span className="text-slate-500">Sumber Resmi:</span>
                  <span className="font-semibold text-slate-800 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-xs">
                    {event.source.name}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 uppercase tracking-wide text-[10px]">Deskripsi Kejadian</h3>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
                {event.description || 'Tidak ada deskripsi tambahan.'}
              </p>
            </div>

            {/* Unique Impact Section */}
            {impactText && (
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold uppercase tracking-wide text-[10px]">Dampak Terjadi & Kerusakan</h3>
                </div>
                <p className="text-amber-900 leading-relaxed bg-amber-50 p-4 rounded-lg border border-amber-200 font-medium">
                  {impactText}
                </p>
              </div>
            )}
          </div>

          {/* Right Column (5 cols) */}
          <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
            {event.metadata && Object.keys(event.metadata).filter(k => k !== 'impact').length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 uppercase tracking-wide text-[10px]">Parameter & Metrik Teknis</h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {Object.entries(event.metadata)
                    .filter(([key]) => key !== 'impact')
                    .map(([key, val]: [string, any]) => (
                      <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase font-medium">{translateMetadataKey(key)}</span>
                        <span className="font-bold text-slate-800 text-right">{translateMetadataValue(val)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-blue-900 space-y-1">
                <span className="font-bold block">Status Verifikasi Resmi</span>
                <p className="text-blue-700 text-[11px]">
                  Terverifikasi melalui sistem integrasi multi-sumber resmi Nusantara Disaster.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-[10px] text-slate-500 font-mono">ID: {event.externalId || event.id}</span>
        </div>
      </div>
    </div>
  );
}
