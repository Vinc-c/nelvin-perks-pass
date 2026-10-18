import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2 } from "lucide-react";
import { geocodeAddress, currentPosition } from "@/lib/geocode";
import { AFRICA_BOUNDS, TILES, MapChrome } from "@/components/map/PartnerMap";
import { NV } from "@/data/offerCategories";

const pin = L.divIcon({
  className: "nelvin-pin",
  iconSize: [34, 44],
  iconAnchor: [17, 44],
  html: `<div style="position:relative;width:34px;height:44px">
    <div style="width:34px;height:34px;border-radius:999px;background:${NV.night};border:4px solid ${NV.gold};box-shadow:0 6px 16px rgba(14,26,59,.35)"></div>
    <div style="position:absolute;left:50%;bottom:2px;width:10px;height:10px;transform:translateX(-50%) rotate(45deg);background:${NV.gold}"></div>
  </div>`,
});

const TEXT = {
  fr: {
    placeholder: "Rue, quartier, repère (ex. Rue Njo-Njo, Bonapriso)",
    address: "Adresse du commerce",
    search: "Localiser l'adresse",
    here: "Je suis sur place",
    notFound: "Adresse introuvable. Essayez avec le quartier et la ville, ou placez le repère sur la carte.",
    searchFail: "La recherche d'adresse ne répond pas. Réessayez dans un instant ou placez le repère sur la carte.",
    denied: "Autorisez l'accès à votre position dans le navigateur.",
    unavailable: "Position introuvable. Utilisez la recherche d'adresse.",
    unsupported: "Votre navigateur ne permet pas la géolocalisation.",
    timeout: "Pas de réponse de la localisation. Autorisez l'accès à votre position, ou cherchez l'adresse.",
    drag: "Faites glisser jusqu'à l'entrée exacte",
    placed: (a, b) => `Repère placé (${a}, ${b}). Faites-le glisser jusqu'à l'entrée exacte du commerce.`,
    hint: "Cherchez l'adresse, utilisez votre position, ou touchez la carte à l'emplacement du commerce.",
    clear: "Retirer le repère",
    map: "Carte : touchez pour placer le commerce",
  },
  en: {
    placeholder: "Street, area, landmark (e.g. Rue Njo-Njo, Bonapriso)",
    address: "Shop address",
    search: "Find address",
    here: "I'm at the shop",
    notFound: "Address not found. Try with the area and city, or place the pin on the map.",
    searchFail: "Address search is not responding. Try again shortly or place the pin on the map.",
    denied: "Allow location access in your browser.",
    unavailable: "Location unavailable. Use the address search instead.",
    unsupported: "Your browser does not support location.",
    timeout: "No response from location. Allow location access, or search the address.",
    drag: "Drag to the exact entrance",
    placed: (a, b) => `Pin placed (${a}, ${b}). Drag it to the shop's exact entrance.`,
    hint: "Search the address, use your location, or tap the map where the shop is.",
    clear: "Remove pin",
    map: "Map: tap to place the shop",
  },
};

function Follow({ point }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 16), { duration: 0.5 });
  }, [point?.lat, point?.lng]);
  return null;
}

function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) }) });
  return null;
}

/**
 * Pick a real position for a shop: search the address (OpenStreetMap),
 * use the device position, or click / drag the pin to the exact door.
 * value = { address, city, lat, lng }
 */
export default function LocationPicker({ value, onChange, dark = false, lang = "fr" }) {
  const T = TEXT[lang] || TEXT.fr;
  const [query, setQuery] = useState(value?.address || "");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const point = value?.lat != null && value?.lng != null && value.lat !== "" ? { lat: Number(value.lat), lng: Number(value.lng) } : null;

  const set = (patch) => onChange({ ...value, ...patch });

  const search = async () => {
    setError("");
    setBusy("search");
    try {
      const rows = await geocodeAddress([query, value?.city].filter(Boolean).join(", "));
      setResults(rows);
      if (rows.length === 0) setError(T.notFound);
    } catch {
      setError(T.searchFail);
    } finally {
      setBusy(null);
    }
  };

  const locateMe = async () => {
    setError("");
    setBusy("me");
    try {
      const p = await currentPosition();
      set({ lat: p.lat, lng: p.lng });
    } catch (e) {
      setError(T[e.code] || T.unavailable);
    } finally {
      setBusy(null);
    }
  };

  const handlers = useMemo(() => ({
    dragend: (e) => {
      const ll = e.target.getLatLng();
      set({ lat: Number(ll.lat.toFixed(6)), lng: Number(ll.lng.toFixed(6)) });
    },
  }), [value]);

  const field = dark
    ? "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#D4A13A]"
    : "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0E1A3B] focus:ring-2 focus:ring-[#0E1A3B]/10";
  const muted = dark ? "text-white/60" : "text-slate-500";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); set({ address: e.target.value }); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(); } }}
          placeholder={T.placeholder}
          aria-label={T.address}
          className={field}
        />
        <button type="button" onClick={search} disabled={busy !== null || query.trim().length < 3}
          className="nv-focus inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#0E1A3B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#27306E] disabled:opacity-50">
          {busy === "search" && <Loader2 className="h-4 w-4 animate-spin" />} {T.search}
        </button>
        <button type="button" onClick={locateMe} disabled={busy !== null}
          className={`nv-focus inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ring-1 disabled:opacity-50 ${dark ? "text-white ring-white/20 hover:bg-white/10" : "text-[#0E1A3B] ring-slate-200 hover:bg-slate-50"}`}>
          {busy === "me" && <Loader2 className="h-4 w-4 animate-spin" />} {T.here}
        </button>
      </div>

      {results.length > 0 && (
        <ul className={`overflow-hidden rounded-lg ring-1 ${dark ? "ring-white/15" : "ring-slate-200"}`}>
          {results.map((r) => (
            <li key={`${r.lat},${r.lng}`}>
              <button type="button"
                onClick={() => { set({ lat: r.lat, lng: r.lng, city: value?.city || r.city }); setResults([]); }}
                className={`nv-focus not-pill block w-full px-3 py-2 text-left text-sm ${dark ? "text-white/85 hover:bg-white/10" : "text-slate-700 hover:bg-slate-50"}`}>
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="text-sm text-[#9C4A2F]">{error}</p>}

      <div className="relative h-64 overflow-hidden rounded-xl ring-1 ring-black/5" aria-label={T.map}>
        <MapContainer bounds={point ? undefined : AFRICA_BOUNDS} center={point ? [point.lat, point.lng] : undefined} zoom={point ? 16 : undefined}
          className="h-full w-full" style={{ background: NV.mist }} scrollWheelZoom={false}>
          <TileLayer attribution={TILES.attribution} url={TILES.url} maxZoom={19} className="nv-tiles" />
          <MapChrome />
          <ClickToPlace onPick={(p) => set(p)} />
          <Follow point={point} />
          {point && <Marker position={[point.lat, point.lng]} icon={pin} draggable eventHandlers={handlers} title={T.drag} />}
        </MapContainer>
      </div>
      <p className={`text-xs ${muted}`}>
        {point ? T.placed(point.lat.toFixed(5), point.lng.toFixed(5)) : T.hint}
        {point && (
          <button type="button" onClick={() => set({ lat: null, lng: null })} className={`not-pill ml-2 font-semibold underline underline-offset-2 ${dark ? "text-white" : "text-[#0E1A3B]"}`}>{T.clear}</button>
        )}
      </p>
    </div>
  );
}
