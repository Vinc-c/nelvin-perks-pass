import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import Supercluster from "supercluster";
import "leaflet/dist/leaflet.css";
import { categoryHues, NV } from "@/data/offerCategories";

// Whole continent, used when there is nothing to frame yet.
export const AFRICA_BOUNDS = [[-35.5, -18.5], [37.6, 52]];

// Basemap: OpenStreetMap tiles by default (no key). Set VITE_MAP_TILE_URL and
// VITE_MAP_TILE_ATTRIBUTION to switch to a commercial provider at scale.
export const TILES = {
  url: import.meta.env.VITE_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: import.meta.env.VITE_MAP_TILE_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

export function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const initials = (name) => String(name || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const safeUrl = (u) => (/^https:\/\//.test(u || "") ? u : "");

// Dark ink on light hues, white on dark ones, for readable initials.
function inkOn(hex) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? NV.night : "#fff";
}

function pinIcon(m, selected) {
  const [c1] = categoryHues(m.category);
  const size = selected ? 52 : 40;
  const logo = safeUrl(m.logo_url);
  const inner = logo
    ? `<img src="${esc(logo)}" alt="" style="width:100%;height:100%;object-fit:contain;background:#fff;border-radius:999px" />`
    : `<span style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;border-radius:999px;background:${c1};color:${inkOn(c1)};font:700 ${selected ? 15 : 12}px Figtree,sans-serif">${esc(initials(m.name))}</span>`;
  return L.divIcon({
    className: "nelvin-pin",
    iconSize: [size, size + 10],
    iconAnchor: [size / 2, size + 10],
    html: `<div style="position:relative;width:${size}px;height:${size + 10}px">
      <div style="width:${size}px;height:${size}px;border-radius:999px;padding:3px;background:${selected ? NV.gold : "#fff"};box-shadow:0 6px 16px rgba(14,26,59,.35)">${inner}</div>
      <div style="position:absolute;left:50%;bottom:0;width:10px;height:10px;transform:translate(-50%,-2px) rotate(45deg);background:${selected ? NV.gold : "#fff"};box-shadow:3px 3px 6px rgba(14,26,59,.2)"></div>
    </div>`,
  });
}

function clusterIcon(count) {
  const size = count < 10 ? 38 : count < 50 ? 46 : 56;
  return L.divIcon({
    className: "nelvin-pin",
    iconSize: [size, size],
    html: `<div style="width:${size}px;height:${size}px;border-radius:999px;background:${NV.night};border:3px solid ${NV.gold};color:#fff;display:flex;align-items:center;justify-content:center;font:700 14px Figtree,sans-serif;box-shadow:0 6px 18px rgba(14,26,59,.4)">${count}</div>`,
  });
}

const meIcon = L.divIcon({
  className: "nelvin-pin",
  iconSize: [22, 22],
  html: `<div style="width:22px;height:22px;border-radius:999px;background:${NV.malachite};border:4px solid #fff;box-shadow:0 0 0 6px rgba(14,124,102,.25)"></div>`,
});

function Clusters({ merchants, selectedId, onSelect }) {
  const map = useMap();
  const [view, setView] = useState({ bounds: null, zoom: map.getZoom() });
  const index = useMemo(() => {
    const sc = new Supercluster({ radius: 56, maxZoom: 16 });
    sc.load(merchants.map((m) => ({ type: "Feature", properties: { id: m.id }, geometry: { type: "Point", coordinates: [Number(m.lng), Number(m.lat)] } })));
    return sc;
  }, [merchants]);
  const byId = useMemo(() => new Map(merchants.map((m) => [m.id, m])), [merchants]);

  const refresh = () => {
    const b = map.getBounds();
    setView({ bounds: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], zoom: map.getZoom() });
  };
  useMapEvents({ moveend: refresh, zoomend: refresh });
  useEffect(refresh, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!view.bounds) return null;
  return index.getClusters(view.bounds, Math.round(view.zoom)).map((f) => {
    const [lng, lat] = f.geometry.coordinates;
    if (f.properties.cluster) {
      return (
        <Marker key={`c${f.id}`} position={[lat, lng]} icon={clusterIcon(f.properties.point_count)}
          eventHandlers={{ click: () => map.flyTo([lat, lng], Math.min(index.getClusterExpansionZoom(f.id), 17), { duration: 0.6 }) }}
          title={`${f.properties.point_count} partenaires`} />
      );
    }
    const m = byId.get(f.properties.id);
    return (
      <Marker key={m.id} position={[lat, lng]} icon={pinIcon(m, m.id === selectedId)} zIndexOffset={m.id === selectedId ? 1000 : 0}
        eventHandlers={{ click: () => onSelect?.(m) }} title={m.name} keyboard alt={m.name} />
    );
  });
}

function Framing({ merchants, selected, me, fitKey }) {
  const map = useMap();
  const framed = useRef(null);
  useEffect(() => {
    const key = `${fitKey}:${merchants.length > 0}`;
    if (framed.current === key) return;
    framed.current = key;
    map.invalidateSize();
    if (merchants.length === 0) map.fitBounds(AFRICA_BOUNDS, { padding: [10, 10] });
    else if (merchants.length === 1) map.setView([Number(merchants[0].lat), Number(merchants[0].lng)], 14);
    else map.fitBounds(L.latLngBounds(merchants.map((m) => [Number(m.lat), Number(m.lng)])), { padding: [48, 48], maxZoom: 14 });
  }, [fitKey, merchants, map]);
  useEffect(() => {
    if (selected) map.flyTo([Number(selected.lat), Number(selected.lng)], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [selected, map]);
  useEffect(() => {
    if (me) map.flyTo(me, 13, { duration: 0.8 });
  }, [me, map]);
  return null;
}

/**
 * Real partner map: OpenStreetMap basemap, clustered
 * partner pins with their logo, the member's position, keyboard-reachable pins.
 */
export default function PartnerMap({ merchants, selectedId, onSelect, me, fitKey = "all", interactive = true, className = "h-full w-full" }) {
  const located = useMemo(
    () => (merchants || []).filter((m) => m.lat != null && m.lng != null && Number.isFinite(Number(m.lat)) && Number.isFinite(Number(m.lng))),
    [merchants],
  );
  const selected = located.find((m) => m.id === selectedId) || null;
  return (
    <MapContainer
      bounds={AFRICA_BOUNDS}
      className={className}
      style={{ background: NV.mist }}
      scrollWheelZoom={interactive}
      dragging={interactive}
      zoomControl={interactive}
      attributionControl
      worldCopyJump
      minZoom={2}
    >
      <TileLayer attribution={TILES.attribution} url={TILES.url} maxZoom={19} className="nv-tiles" />
      <Framing merchants={located} selected={selected} me={me} fitKey={fitKey} />
      <Clusters merchants={located} selectedId={selectedId} onSelect={onSelect} />
      {me && <Marker position={me} icon={meIcon} title="Vous êtes ici" />}
    </MapContainer>
  );
}
