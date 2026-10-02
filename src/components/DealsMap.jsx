import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

// Custom emoji marker (avoids the missing default-icon asset problem in bundlers)
function makeIcon(emoji) {
  return L.divIcon({
    className: "nelvin-marker",
    html: `<div style="font-size:22px; line-height:1; filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

const CATEGORY_EMOJI = {
  RESTAURANT: "🍽️",
  HOTEL: "🏨",
  SPA: "💆",
  SPORT: "🏋️",
  LEISURE: "🎉",
  RETAIL: "🛍️",
  HEALTH: "🏥",
};

function Recenter({ center }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, 3);
  }, [center, map]);
  return null;
}

export default function DealsMap({ merchants, onSelect }) {
  const { t } = useI18n();
  const [center] = useState([3.5, 18.0]); // Africa-centered view

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <Navigation className="h-5 w-5 text-emerald-600" /> {t("offers.nearby")}
        </h2>
        <span className="text-xs text-slate-500">{merchants.length} merchants</span>
      </div>
      <div className="h-72 w-full">
        <MapContainer center={center} zoom={3} scrollWheelZoom={false} style={{ height: "100%", width: "100%", background: "#e5e7eb" }}>
          <Recenter center={center} />
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {merchants.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={makeIcon(CATEGORY_EMOJI[m.category] || "📍")}>
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">{m.name}</p>
                  <p className="text-xs text-slate-600">{m.category} · {m.city}, {m.country}</p>
                  <p className="text-xs text-slate-600">★ {m.rating} · {m.verified_status}</p>
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
        <MapPin className="h-3 w-3" /> Tap a pin to discover deals near you.
      </p>
    </div>
  );
}