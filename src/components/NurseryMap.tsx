"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapMarker {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
}

// Branded teardrop pin (accent teal) rendered as a Leaflet divIcon — avoids
// the well-known bundler headache with Leaflet's default marker images
// (they reference relative image paths that don't survive a Next.js build)
// and lets the pin match the site's palette instead of Leaflet's default blue.
const PIN_SVG = `
<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0Z" fill="var(--primary)"/>
  <circle cx="14" cy="14" r="5.5" fill="#ffffff"/>
</svg>`;

export function NurseryMap({
  markers,
  height = 320,
  singleMarkerZoom = 14,
  className,
}: {
  markers: MapMarker[];
  height?: number;
  singleMarkerZoom?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [ready, setReady] = useState(false);

  // Create the map once on mount.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, { scrollWheelZoom: false });
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      map.setView([39.8, -98.6], 4);
      setReady(true);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Plot markers once the map exists, and whenever the marker set changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    let cancelled = false;
    let layerGroup: ReturnType<import("leaflet").LayerGroup["addTo"]> | null = null;

    import("leaflet").then((L) => {
      if (cancelled) return;
      const icon = L.divIcon({
        html: PIN_SVG,
        className: "",
        iconSize: [28, 36],
        iconAnchor: [14, 34],
        popupAnchor: [0, -30],
      });

      const group = L.layerGroup();
      for (const m of markers) {
        const marker = L.marker([m.lat, m.lng], { icon });
        const link = document.createElement("a");
        link.href = `/nursery/${m.slug}`;
        link.textContent = m.name;
        link.className = "font-semibold text-[13px]";
        link.style.color = "var(--primary-dark)";
        marker.bindPopup(link);
        group.addLayer(marker);
      }
      group.addTo(map);
      layerGroup = group;

      if (markers.length === 1) {
        map.setView([markers[0].lat, markers[0].lng], singleMarkerZoom);
      } else if (markers.length > 1) {
        map.fitBounds(
          L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number])),
          { padding: [28, 28] },
        );
      }
    });

    return () => {
      cancelled = true;
      layerGroup?.remove();
    };
  }, [markers, singleMarkerZoom, ready]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className={`w-full rounded-[16px] bg-[#eef1ef] ${className ?? ""}`}
    />
  );
}
