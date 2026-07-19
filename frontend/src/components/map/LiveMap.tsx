import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Order, Driver } from '../../store/useAppStore';

const createPinIcon = (colorHex: string, svgInner: string) =>
  L.divIcon({
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:32px;height:32px;border-radius:50%;background:${colorHex};opacity:0.2;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="width:38px;height:38px;border-radius:50%;background:${colorHex};color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.25);border:2px solid #fff;">
        ${svgInner}
      </div>
    </div>`,
    className: '',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });

const restaurantIcon = createPinIcon(
  '#10b981',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><path d="m12 3-1.912 5.886a1 1 0 0 1-.95.688H3l4.9 3.56a1 1 0 0 1 .36 1.11L6.35 21 12 17.27 17.65 21l-1.91-6.756a1 1 0 0 1 .36-1.11L21 9.574h-6.138a1 1 0 0 1-.95-.688L12 3Z"/></svg>`
);

const customerIcon = createPinIcon(
  '#3b82f6',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
);

const driverIcon = createPinIcon(
  '#f59e0b',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1f2937" stroke-width="2.5" width="18" height="18"><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"/></svg>`
);

interface LiveMapProps {
  activeOrder?: Order | null;
  driver?: Driver | null;
}

export const LiveMap: React.FC<LiveMapProps> = ({ activeOrder, driver }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [, forceUpdate] = useState(0);

  // ── Create & destroy map imperatively ──────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Guard: if Leaflet already owns this node (StrictMode double-invoke),
    // destroy the old instance before creating a new one.
    if ((el as any)._leaflet_id) {
      try { (el as any)._leaflet_map?.remove(); } catch (_) {}
      delete (el as any)._leaflet_id;
    }

    const initialCenter: L.LatLngExpression = activeOrder
      ? [activeOrder.restaurantLat, activeOrder.restaurantLng]
      : driver
        ? [driver.lat, driver.lng]
        : [40.7306, -73.9352];

    const map = L.map(el, {
      center: initialCenter,
      zoom: 13,
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: true,
    });

    // Keep a back-reference so the guard above works
    (el as any)._leaflet_map = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Force a resize so tiles fill the container properly
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      // Clear driver animation interval
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;

      // Remove all markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      // Fully destroy the Leaflet map → clears _leaflet_id
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update markers when order/driver data changes ─────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Clear old driver interval
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;

    if (activeOrder) {
      const { restaurantLat, restaurantLng, deliveryLat, deliveryLng, restaurantName, deliveryAddress, status } = activeOrder;

      // Restaurant pin
      const restMarker = L.marker([restaurantLat, restaurantLng], { icon: restaurantIcon })
        .addTo(map)
        .bindPopup(`<b>Restaurant</b><br/>${restaurantName}`);
      markersRef.current.push(restMarker);

      // Customer pin
      const custMarker = L.marker([deliveryLat, deliveryLng], { icon: customerIcon })
        .addTo(map)
        .bindPopup(`<b>Delivery Address</b><br/>${deliveryAddress}`);
      markersRef.current.push(custMarker);

      // Fit bounds to show both pins
      map.fitBounds(
        [[restaurantLat, restaurantLng], [deliveryLat, deliveryLng]],
        { padding: [40, 40], maxZoom: 15 }
      );

      // Driver pin simulation
      if (status === 'READY' || status === 'PICKED_UP') {
        const startPos: L.LatLngExpression =
          status === 'READY'
            ? [restaurantLat + 0.008, restaurantLng - 0.008]
            : [restaurantLat, restaurantLng];

        const driverMarker = L.marker(startPos, { icon: driverIcon })
          .addTo(map)
          .bindPopup('<b>Delivery Partner</b><br/>En Route');
        markersRef.current.push(driverMarker);

        if (status === 'PICKED_UP') {
          let step = 0;
          const totalSteps = 40;
          intervalRef.current = setInterval(() => {
            if (step >= totalSteps) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              intervalRef.current = null;
              return;
            }
            const progress = step / totalSteps;
            const lat = restaurantLat + (deliveryLat - restaurantLat) * progress;
            const lng = restaurantLng + (deliveryLng - restaurantLng) * progress;
            driverMarker.setLatLng([lat, lng]);
            step++;
          }, 1000);
        }
      }
    } else if (driver) {
      const driverMarker = L.marker([driver.lat, driver.lng], { icon: driverIcon })
        .addTo(map)
        .bindPopup(`<b>${driver.name}</b><br/>${driver.vehicleType} (${driver.vehiclePlate})`);
      markersRef.current.push(driverMarker);
      map.setView([driver.lat, driver.lng], 14);
    }

    forceUpdate(n => n + 1); // ensure re-render if needed
  }, [activeOrder?.id, activeOrder?.status, driver?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: '240px', borderRadius: '22px', overflow: 'hidden' }}
    />
  );
};
