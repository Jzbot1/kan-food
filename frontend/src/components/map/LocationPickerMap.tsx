import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const pickerIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({ lat, lng, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange; // keep fresh without re-running effect

  // ── Create map once ────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Guard against StrictMode double-invoke / framer-motion reappear
    if ((el as any)._leaflet_id) {
      try { (el as any)._leaflet_map?.remove(); } catch (_) {}
      delete (el as any)._leaflet_id;
    }

    const center: L.LatLngExpression = [lat || 40.7484, lng || -73.9857];

    const map = L.map(el, {
      center,
      zoom: 14,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    (el as any)._leaflet_map = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Draggable marker
    const marker = L.marker(center, { icon: pickerIcon, draggable: true }).addTo(map);
    marker.on('dragend', () => {
      const ll = marker.getLatLng();
      onChangeRef.current(ll.lat, ll.lng);
    });

    // Click to reposition
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChangeRef.current(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync marker position when lat/lng props change ─────────────────────
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    const newPos: L.LatLngExpression = [lat || 40.7484, lng || -73.9857];
    markerRef.current.setLatLng(newPos);
    mapRef.current.setView(newPos, mapRef.current.getZoom());
  }, [lat, lng]);

  return (
    <div className="w-full h-48 rounded-2xl overflow-hidden border border-slate-100 shadow-inner relative z-10">
      <div ref={containerRef} className="w-full h-full" />
      {/* Visual hint overlay */}
      <div className="absolute bottom-2 left-2 bg-slate-900/90 text-[8px] text-slate-300 font-bold px-2 py-1 rounded-md z-[1000] border border-slate-800 pointer-events-none">
        📍 Drag pin or tap map to set delivery spot
      </div>
    </div>
  );
};
