"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { EVENT_LABEL, type LatestPosition, type LocationEntry } from "@/services/locations";

const BANDUNG: [number, number] = [-6.9175, 107.6191];
const when = (iso: string) => new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const esc = (s = "") => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Peta OpenStreetMap (gratis, tanpa API key) lewat Leaflet. Titik besar = posisi terakhir tiap teknisi
 * (hijau = baru, abu-abu = sudah lama tidak update); titik kecil = riwayat. Leaflet dimuat di browser saja.
 */
export default function LocationMap({ latest, history, focus }: { latest: LatestPosition[]; history: LocationEntry[]; focus?: string | null }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const lib = useRef<typeof import("leaflet") | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !box.current || map.current) return;
      lib.current = L;
      map.current = L.map(box.current).setView(BANDUNG, 11);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map.current);
      layer.current = L.layerGroup().addTo(map.current);
      setReady(true);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const L = lib.current;
    if (!L || !map.current || !layer.current) return;
    layer.current.clearLayers();
    const shown = focus ? history.filter((h) => h.technicianId === focus) : history;
    if (focus && shown.length > 1) {
      // Jejak perjalanan satu teknisi, diurutkan dari yang terlama.
      const track = [...shown].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()).map((h): [number, number] => [h.lat, h.lng]);
      L.polyline(track, { color: "#2563eb", weight: 3, opacity: 0.7 }).addTo(layer.current);
    }
    for (const h of shown) {
      L.circleMarker([h.lat, h.lng], { radius: 4, color: "#64748b", weight: 1, fillOpacity: 0.5 })
        .bindPopup(`${esc(h.technicianName)}<br>${EVENT_LABEL[h.event]}${h.serial ? ` · ${esc(h.equipmentName)} (${esc(h.serial)})` : ""}<br>${when(h.at)}`)
        .addTo(layer.current);
    }
    const points: [number, number][] = [];
    for (const p of latest) {
      if (focus && p.technicianId !== focus) continue;
      points.push([p.lat, p.lng]);
      L.circleMarker([p.lat, p.lng], { radius: 10, color: p.stale ? "#6b7280" : "#15803d", weight: 3, fillOpacity: 0.8 })
        .bindTooltip(esc(p.technicianName), { permanent: true, direction: "top", offset: [0, -10] })
        .bindPopup(
          `<b>${esc(p.technicianName)}</b><br>Terakhir: ${when(p.at)} (${EVENT_LABEL[p.event]})` +
            `${p.accuracy ? `<br>Akurasi ±${p.accuracy} m` : ""}` +
            `<br><a href="https://www.google.com/maps?q=${p.lat},${p.lng}" target="_blank" rel="noopener">Buka di Google Maps</a>`,
        )
        .addTo(layer.current);
    }
    if (points.length === 1) map.current.setView(points[0], 15);
    else if (points.length > 1) map.current.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 15 });
  }, [ready, latest, history, focus]);

  return <div ref={box} data-testid="location-map" className="h-[60vh] min-h-[320px] w-full overflow-hidden rounded-[18px] border border-line" />;
}
