import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { categoryMeta } from "@/data/offerCategories";

// Custom emoji marker (avoids the missing default-icon asset problem in bundlers)
function makeIcon(emoji) {
  return L.divIcon({
    className: "nelvin-marker",
    html: `<div style="font-size:22px; line-height:1; filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

function Recenter({ center, zoom }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Great-circle distance in km.
export function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function DealsMap({ merchants, onSelect, onLocate, height = "h-72" }) {
  const { t } = useI18n();
  const [view, setView] = useState({ center: [3.5, 18.0], zoom: 3 }); // Africa-centered view
  const [locating, setLocating] = useState(false);
  const [me, setMe] = useState(null);
  const located = (merchants || []).filter((m) => Number.isFinite(Number(m.lat)) && Number.isFinite(Number(m.lng)) && m.lat !== null && m.lng !== null);

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        setMe(p);
        setView({ center: p, zoom: 12 });
        onLocate?.(p);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <Navigation className="h-5 w-5 text-emerald-600" /> {t("offers.nearby")}
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{located.length} partenaires</span>
          <button onClick={locate} disabled={locating} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            {locating ? "…" : "Autour de moi"}
          </button>
        </div>
      </div>
      <div className={`${height} w-full`}>
        <MapContainer center={view.center} zoom={view.zoom} scrollWheelZoom={false} style={{ height: "100%", width: "100%", background: "#e5e7eb" }}>
          <Recenter center={view.center} zoom={view.zoom} />
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {me && <Marker position={me} icon={makeIcon("🧍")} />}
          {located.map((m) => (
            <Marker key={m.id} position={[Number(m.lat), Number(m.lng)]} icon={makeIcon(categoryMeta(m.category).emoji || "📍")}>
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">{m.name}</p>
                  <p className="text-xs text-slate-600">{categoryMeta(m.category).label} · {m.city}, {m.country}</p>
                  {me && <p className="text-xs text-slate-500">{distanceKm(me, [Number(m.lat), Number(m.lng)]).toFixed(1)} km</p>}
                  <button
                    onClick={() => onSelect && onSelect(m)}
                    className="mt-1 rounded-md bg-emerald-500 px-2 py-1 text-xs font-medium text-white"
                  >
                    {t("cta.redeem")}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <p className="flex items-center gap-1.5 px-5 py-3 text-xs text-slate-400">
        <MapPin className="h-3 w-3" /> Touchez un repère pour voir les offres du partenaire.
      </p>
    </div>
  );
}