'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { detectCategory, getCategoryIcon } from '@/lib/formatters';

interface MapProps {
  events: any[];
  onSelectEvent: (event: any) => void;
  selectedEvent?: any;
}

const OSM_STYLE: any = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
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

export function MapLibreMap({ events, onSelectEvent, selectedEvent }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const markerElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const markersMapRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Clean up existing map instance if any (React 18 StrictMode support)
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const isMobile = window.innerWidth < 768;
    const initialZoom = isMobile ? 2.5 : 3.3;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: OSM_STYLE,
      center: [117.5, -1.8], // Centered view over the Indonesian archipelago
      zoom: initialZoom,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      map.resize();
      setMapLoaded(true);
    });

    mapInstance.current = map;

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
      markerElementsRef.current.clear();
      markersMapRef.current.clear();
      map.remove();
      mapInstance.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Render marker ONLY when selectedEvent is clicked (hidden by default on initial page load)
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    markerElementsRef.current.clear();
    markersMapRef.current.clear();

    if (!selectedEvent) return;

    const lat = Number(selectedEvent.latitude);
    const lng = Number(selectedEvent.longitude);

    if (!lat || !lng) return;

    map.flyTo({
      center: [lng, lat],
      zoom: 8.5,
      essential: true,
    });

    const el = document.createElement('div');
    el.className = 'relative w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl cursor-pointer transition-all duration-300 hover:scale-125 hover:shadow-2xl z-35 border-2 border-white marker-selected-glow scale-110';

    const cat = detectCategory(selectedEvent);
    const iconSymbol = getCategoryIcon(selectedEvent);
    let bgClass = 'bg-slate-900';

    switch (cat) {
      case 'EARTHQUAKE':
      case 'GEMPA':
        bgClass = 'bg-red-600 animate-slow-bounce shadow-red-500/50';
        break;
      case 'VOLCANO':
      case 'GUNUNG_API':
      case 'ERUPSI':
        bgClass = 'bg-rose-600 animate-slow-pulse shadow-rose-500/50';
        break;
      case 'FLOOD':
      case 'BANJIR':
        bgClass = 'bg-blue-600 animate-slow-bounce shadow-blue-500/50';
        break;
      case 'LANDSLIDE':
      case 'LONGSOR':
        bgClass = 'bg-amber-600 animate-slow-pulse shadow-amber-500/50';
        break;
      case 'WILDFIRE':
      case 'FIRE':
      case 'KEBAKARAN':
      case 'KARHUTLA':
        bgClass = 'bg-orange-600 animate-slow-bounce shadow-orange-500/50';
        break;
      case 'WEATHER':
      case 'CUACA':
      case 'EXTREME_WEATHER':
        bgClass = 'bg-indigo-600 animate-slow-pulse shadow-indigo-500/40';
        break;
      default:
        bgClass = 'bg-slate-800 animate-slow-pulse';
    }

    bgClass.split(' ').forEach(c => el.classList.add(c));
    let iconHtml = `<span class="text-sm select-none">${iconSymbol}</span>`;
    if (cat === 'EARTHQUAKE' || cat === 'GEMPA') {
      iconHtml = `<svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
    } else if (cat === 'WEATHER' || cat === 'CUACA' || cat === 'EXTREME_WEATHER') {
      iconHtml = `<svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" fill="white" opacity="0.4"/><path d="M12 2v2m4.93 1.07l-1.42 1.42M20 12h2m-1.07 4.93l-1.42-1.42M16 16.5A4.5 4.5 0 0 1 7.5 14a5 5 0 0 1 9.25-2.25"/><path d="M19 18H5a3 3 0 0 1 0-6 4 4 0 0 1 7.4-1.8"/></svg>`;
    }
    el.innerHTML = iconHtml;
    el.title = `${selectedEvent.title} (${selectedEvent.locationName || selectedEvent.province || 'Indonesia'})`;

    el.addEventListener('click', () => {
      onSelectEvent(selectedEvent);
    });

    // Create compact, borderless title badge with ONLY the disaster title
    const titleBanner = document.createElement('div');
    titleBanner.className = 'disaster-title-badge absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 text-white font-semibold text-[10px] px-2.5 py-1 rounded-lg shadow-xl z-50 pointer-events-none flex items-center animate-in fade-in duration-200';

    titleBanner.innerHTML = `
      <span>${selectedEvent.title}</span>
    `;
    el.appendChild(titleBanner);

    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([lng, lat])
      .addTo(map);

    markersRef.current.push(marker);
    markerElementsRef.current.set(selectedEvent.id, el);
    markersMapRef.current.set(selectedEvent.id, marker);
  }, [selectedEvent, mapLoaded, onSelectEvent]);

  return (
    <div className="relative w-full h-[560px] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-300 bg-slate-900">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Global CSS for smooth animations & marker glow */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes radarPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.85);
          }
          70% {
            box-shadow: 0 0 0 14px rgba(6, 182, 212, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(6, 182, 212, 0);
          }
        }
        .marker-selected-glow {
          animation: radarPulse 1.8s infinite ease-out !important;
          outline: 3px solid #22d3ee !important;
          outline-offset: 2px !important;
        }
      ` }} />
    </div>
  );
}
