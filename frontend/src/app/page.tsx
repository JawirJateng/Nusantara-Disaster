'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { NewsFeed } from '@/components/NewsFeed';
import { NotificationToast } from '@/components/NotificationToast';
import { EventDetailModal } from '@/components/EventDetailModal';
import { fetchAPI } from '@/lib/api';
import { translateCategory, translateSeverity, translateMetadataKey, translateMetadataValue } from '@/lib/formatters';
import { CategoryIcon } from '@/components/CategoryIcon';
import { MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

const MapLibreMap = dynamic(
  () => import('@/components/MapLibreMap').then((mod) => mod.MapLibreMap),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-[560px] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-900 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold tracking-wide text-slate-300">Memuat Peta Interaktif Nusantara...</span>
      </div>
    ),
  }
);

export default function PublicHomepage() {
  const [events, setEvents] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null); // For map zoom / focus
  const [newestToastEvent, setNewestToastEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const prevEventsRef = useRef<string[]>([]);

  const loadData = async (isInitial = false) => {
    try {
      setLoading(true);
      const [eventsRes, newsRes] = await Promise.all([
        fetchAPI('/events?limit=100&rollingWindow=7d'),
        fetchAPI('/news?limit=6'),
      ]);
      const fetchedEvents = eventsRes.items || [];
      
      if (!isInitial && fetchedEvents.length > 0) {
        const latestId = fetchedEvents[0].id;
        if (prevEventsRef.current.length > 0 && !prevEventsRef.current.includes(latestId)) {
          setNewestToastEvent(fetchedEvents[0]);
        }
      }

      prevEventsRef.current = fetchedEvents.map((e: any) => e.id);
      setEvents(fetchedEvents);
      setNews(newsRes.items || []);
    } catch (err) {
      console.error('Failed to load NDW data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => {
      loadData(false);
    }, 30000); // Auto-sync poll every 30 seconds for live data
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-full flex flex-col">
      <Header />

      {/* Main Content: Side-by-Side Responsive Layout (Left: Events Feed, Right: Interactive Map) */}
      <main className="flex-1 container mx-auto px-4 py-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kejadian Bencana Nasional</h1>
          </div>
        </div>

        {/* Side-by-Side Grid: Left (Disaster List with Inline Accordion Dropdown), Right (Map) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Disaster Events Feed (Scrollable with Accordion & Map Zoom) */}
          <div className="order-1 lg:order-1 lg:col-span-5 space-y-3 max-h-[500px] lg:max-h-[560px] overflow-y-auto pr-1">
            {events.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                Tidak ada kejadian yang tersedia.
              </div>
            ) : (
              events.map((ev) => {
                const isExpanded = expandedId === ev.id;
                return (
                  <div
                    key={ev.id}
                    onClick={() => {
                      setExpandedId(isExpanded ? null : ev.id);
                      setSelectedEvent({ ...ev }); // Automatically zoom and center map on this event location
                    }}
                    className={`bg-white p-4 rounded-xl border-2 transition-all cursor-pointer space-y-2.5 group ${
                      isExpanded ? 'border-blue-600 shadow-lg bg-blue-50/20' : 'border-slate-300 shadow-sm hover:shadow-md hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CategoryIcon eventOrCat={ev} className="w-5 h-5" />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 uppercase tracking-wide">
                          {translateCategory(ev)}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        ev.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 animate-pulse' :
                        ev.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {translateSeverity(ev.severity)}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors leading-snug">
                      {ev.title}
                    </h3>

                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="truncate">{ev.locationName} ({ev.province})</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(ev.occurredAt).toLocaleDateString('id-ID')}</span>
                      </span>
                      <span className="font-semibold text-blue-600 flex items-center space-x-1">
                        <span>{isExpanded ? 'Tutup Detail' : 'Klik untuk Detail'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </span>
                    </div>

                    {/* Inline Accordion Dropdown Content */}
                    {isExpanded && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="pt-3 mt-3 border-t border-slate-200 space-y-3 animate-fade-in text-xs"
                      >
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wide block">Deskripsi Kejadian</span>
                          <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                            {ev.description || 'Tidak ada deskripsi tambahan.'}
                          </p>
                        </div>

                        {ev.metadata?.impact && (
                          <div className="space-y-1">
                            <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wide block">Dampak Terjadi & Kerusakan</span>
                            <p className="text-amber-900 leading-relaxed bg-amber-50 p-3 rounded-lg border border-amber-200 font-medium">
                              {ev.metadata.impact}
                            </p>
                          </div>
                        )}

                        {ev.source && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                            <span className="text-slate-500">Sumber Resmi:</span>
                            <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                              {ev.source.name}
                            </span>
                          </div>
                        )}

                        {ev.metadata && Object.keys(ev.metadata).filter(k => k !== 'impact').length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wide block">Parameter Teknis</span>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(ev.metadata)
                                .filter(([key]) => key !== 'impact')
                                .map(([key, val]: [string, any]) => (
                                  <div key={key} className="bg-white p-2 rounded-lg border border-slate-200">
                                    <span className="text-[9px] text-slate-400 block uppercase font-medium">{translateMetadataKey(key)}</span>
                                    <span className="font-bold text-slate-800 text-[11px] mt-0.5 block">{translateMetadataValue(val)}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 flex items-center justify-between text-slate-400 border-t border-slate-100">
                          <span className="font-mono text-[9px]">ID: {ev.externalId || ev.id}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Interactive Map */}
          <div className="order-2 lg:order-2 lg:col-span-7">
            <MapLibreMap
              events={events}
              onSelectEvent={(ev) => {
                setSelectedEvent({ ...ev });
                setExpandedId(ev.id); // Also expand corresponding feed card when map marker is clicked
              }}
              selectedEvent={selectedEvent}
            />
          </div>
        </div>

        {/* Disaster News & Situation Reports */}
        <section className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Berita Bencana Alam</h2>
            <span className="text-xs text-slate-500">Pembaruan resmi dari instansi & media terpercaya</span>
          </div>
          <NewsFeed news={news} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
