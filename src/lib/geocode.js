// Address search on OpenStreetMap's Nominatim service.
// Usage policy: at most one request per second, results must credit OSM.
// We only call it on an explicit click, never while typing.

const ENDPOINT = "https://nominatim.openstreetmap.org/search";
let last = 0;

export async function geocodeAddress(query, { country } = {}) {
  const q = String(query || "").trim();
  if (q.length < 3) return [];
  const wait = 1100 - (Date.now() - last);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  last = Date.now();

  const params = new URLSearchParams({ q, format: "jsonv2", limit: "5", addressdetails: "1", "accept-language": "fr" });
  if (country && /^[a-z]{2}$/i.test(country)) params.set("countrycodes", country.toLowerCase());
  const res = await fetch(`${ENDPOINT}?${params}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Le service de géolocalisation ne répond pas. Réessayez dans un instant.");
  const rows = await res.json();
  return rows.map((r) => ({
    label: r.display_name,
    lat: Number(Number(r.lat).toFixed(6)),
    lng: Number(Number(r.lon).toFixed(6)),
    city: r.address?.city || r.address?.town || r.address?.village || r.address?.suburb || "",
    country: r.address?.country || "",
  }));
}

export function currentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Votre navigateur ne permet pas la géolocalisation."));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: Number(p.coords.latitude.toFixed(6)), lng: Number(p.coords.longitude.toFixed(6)), accuracy: p.coords.accuracy }),
      (e) => reject(new Error(e.code === 1 ? "Autorisez l'accès à votre position dans le navigateur." : "Position introuvable. Utilisez la recherche d'adresse.")),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  });
}
