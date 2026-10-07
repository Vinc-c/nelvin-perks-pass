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

export function currentPosition({ timeoutMs = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    const fail = (code, msg) => Object.assign(new Error(msg), { code });
    if (!navigator.geolocation) return reject(fail("unsupported", "Votre navigateur ne permet pas la géolocalisation."));
    // Browsers wait indefinitely while the permission prompt is open: give up
    // after a while so the interface never stays stuck.
    let done = false;
    const guard = setTimeout(() => {
      if (done) return;
      done = true;
      reject(fail("timeout", "Pas de réponse de la localisation. Autorisez l'accès à votre position, ou cherchez l'adresse."));
    }, timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (done) return;
        done = true;
        clearTimeout(guard);
        resolve({ lat: Number(p.coords.latitude.toFixed(6)), lng: Number(p.coords.longitude.toFixed(6)), accuracy: p.coords.accuracy });
      },
      (e) => {
        if (done) return;
        done = true;
        clearTimeout(guard);
        reject(e.code === 1
          ? fail("denied", "Autorisez l'accès à votre position dans le navigateur.")
          : fail("unavailable", "Position introuvable. Utilisez la recherche d'adresse."));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  });
}
