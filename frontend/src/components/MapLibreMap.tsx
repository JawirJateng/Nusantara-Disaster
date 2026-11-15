'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AnimatePresence, motion } from 'motion/react';
import { detectCategory } from '@/lib/formatters';

interface MapProps {
  events: any[];
  onSelectEvent: (event: any) => void;
  selectedEvent?: any;
}

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

// Official MapTiler "Streets" vector style; OSM raster when no key is configured.
const MAP_STYLE: any = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v4/style.json?key=${MAPTILER_KEY}`
  : {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: 'osm-tiles-layer',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    };

// SVG markup matching exactly what CategoryIcon.tsx renders for each disaster type
const CATEGORY_SVGS: Record<string, { bg: string; svg: string }> = {
  EARTHQUAKE: {
    bg: 'bg-red-600',
    svg: `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`
  },
  VOLCANO: {
    bg: 'bg-rose-600',
    svg: `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M17 18a5 5 0 0 0-10 0"/><path d="M12 2v2"/><path d="M12 9l-1.5 1.5"/><path d="M15.5 12.5l-1.5 1.5"/></svg>`
  },
  FLOOD: {
    bg: 'bg-blue-600',
    svg: `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 16c0 4.5 3.5 8 8 8s8-3.5 8-8"/><path d="M2 20c0-4.5 3.5-8 8-8s8 3.5 8 8"/><path d="M10 2c0 4.5-3.5 8-8 8S2 6.5 2 2s3.5-8 8-8 8 3.5 8 8"/></svg>`
  },
  LANDSLIDE: {
    bg: 'bg-amber-600',
    svg: `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6h12"/><path d="M6 10h12"/><path d="M6 14h12"/><path d="M4 22h16"/></svg>`
  },
  WILDFIRE: {
    bg: 'bg-orange-600',
    svg: `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`
  },
  WEATHER: {
    bg: 'bg-indigo-600',
    svg: `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.4"/><path d="M12 2v2m4.93 1.07l-1.42 1.42M20 12h2m-1.07 4.93l-1.42-1.42"/></svg>`
  },
  DEFAULT: {
    bg: 'bg-slate-700',
    svg: `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`
  }
};

const CATEGORY_DOT_COLORS: Record<string, string> = {
  EARTHQUAKE: 'bg-red-600',
  VOLCANO: 'bg-rose-600',
  FLOOD: 'bg-blue-600',
  LANDSLIDE: 'bg-amber-600',
  WILDFIRE: 'bg-orange-600',
  WEATHER: 'bg-indigo-600',
};

export function MapLibreMap({ events, onSelectEvent, selectedEvent }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const markersMapRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const labelPopupRef = useRef<maplibregl.Popup | null>(null);
  const [labelContainer] = useState(() => document.createElement('div'));
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const isMobile = window.innerWidth < 768;
    const initialZoom = isMobile ? 2.5 : 3.3;

    // Bundlers never emit maplibre's worker next to its chunk; serve the copy in /public instead.
    maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [117.5, -1.8],
      zoom: initialZoom,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      map.resize();
      setMapLoaded(true);
    });

    mapInstance.current = map;

    const labelPopup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      anchor: 'bottom',
      offset: 26,
      maxWidth: '280px',
      className: 'ndw-event-label-popup',
    });
    labelPopup.setDOMContent(labelContainer);
    labelPopupRef.current = labelPopup;

    const handleResize = () => {
      map.resize();
    };
    window.addEventListener('resize', handleResize);

    const timer = setTimeout(() => {
      map.resize();
      setMapLoaded(true);
    }, 400);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      markersMapRef.current.clear();
      labelPopup.remove();
      labelPopupRef.current = null;
      map.remove();
      mapInstance.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Render markers matching CategoryIcon exactly
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    markersMapRef.current.clear();

    events.forEach((ev) => {
      const lat = Number(ev.latitude);
      const lng = Number(ev.longitude);
      if (!lat || !lng) return;

      const cat = detectCategory(ev);
      const config = CATEGORY_SVGS[cat] || CATEGORY_SVGS.DEFAULT;

      const el = document.createElement('div');
      el.className = `relative w-8 h-8 rounded-md flex items-center justify-center shadow-md cursor-pointer transition-all duration-300 hover:scale-125 hover:shadow-lg z-35 border-2 border-surface ${config.bg} animate-slow-pulse`;
      el.style.borderRadius = '8px';
      el.style.animation = 'slowPulse 3s ease-in-out infinite';
      el.title = `${ev.title} (${ev.locationName || ev.province || 'Indonesia'})`;

      el.innerHTML = config.svg;

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([lng, lat])
        .addTo(map);

      marker.getElement().addEventListener('click', () => {
        onSelectEvent({ ...ev });
      });

      markersRef.current.push(marker);
      markersMapRef.current.set(ev.id, marker);
    });
  }, [events, mapLoaded, onSelectEvent]);

  // Place the label above the selected event and let MapLibre keep it anchored
  useEffect(() => {
    const popup = labelPopupRef.current;
    const map = mapInstance.current;
    if (!popup || !map || !mapLoaded) return;

    if (!selectedEvent) {
      popup.remove();
      return;
    }

    const lat = Number(selectedEvent.latitude);
    const lng = Number(selectedEvent.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    popup.setLngLat([lng, lat]).addTo(map);
  }, [selectedEvent, mapLoaded]);

  // Fly to and highlight selected event
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded || !selectedEvent) return;

    const lat = Number(selectedEvent.latitude);
    const lng = Number(selectedEvent.longitude);
    if (!lat || !lng) return;

    map.flyTo({
      center: [lng, lat],
      zoom: 8.5,
      essential: true,
    });

    const marker = markersMapRef.current.get(selectedEvent.id);
    if (marker) {
      const el = marker.getElement();
      el.classList.add('ring-4', 'ring-sage-400', 'ring-offset-2', 'ring-offset-surface');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-sage-400', 'ring-offset-2', 'ring-offset-surface');
      }, 2000);
    }
  }, [selectedEvent, mapLoaded]);

  return (
    <div className="relative w-full h-[560px] rounded-card overflow-hidden shadow-card border border-line bg-forest-950">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {createPortal(
        <AnimatePresence mode="wait">
          {selectedEvent && (
            <motion.div
              key={selectedEvent.id}
              initial={{ opacity: 0, y: 8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="pointer-events-none relative w-max max-w-[260px] origin-bottom rounded-card border border-line bg-surface/95 px-3 py-2 shadow-floating backdrop-blur-sm"
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    CATEGORY_DOT_COLORS[detectCategory(selectedEvent)] || 'bg-slate-500'
                  }`}
                />
                <p className="line-clamp-2 text-xs font-semibold leading-snug text-ink">
                  {selectedEvent.title}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        labelContainer
      )}

      <div className="absolute top-3 left-3 z-10 bg-surface/95 backdrop-blur-sm rounded-button px-3 py-1.5 text-xs font-semibold text-ink shadow-card border border-line flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-sage-400 animate-ping" />
        <span>Peta Indonesia</span>
      </div>
    </div>
  );
}