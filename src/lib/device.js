// Stable per-install device id (browser profile or native app) used for the
// "max 4 devices per account" rule. Not a secret: the server only counts them.
const KEY = "nelvin_device_id";

export function getDeviceId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id || id.length < 8) {
      id = (crypto.randomUUID && crypto.randomUUID()) || `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "volatile-" + Math.random().toString(36).slice(2, 12);
  }
}

export function resetDeviceId() {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}

/** Human label such as "Chrome · Android". */
export function deviceLabel() {
  const ua = (typeof navigator !== "undefined" && navigator.userAgent) || "";
  const browser = /edg\//i.test(ua) ? "Edge" : /opr\/|opera/i.test(ua) ? "Opera" : /chrome|crios/i.test(ua) ? "Chrome" : /firefox|fxios/i.test(ua) ? "Firefox" : /safari/i.test(ua) ? "Safari" : "Browser";
  const os = /android/i.test(ua) ? "Android" : /iphone|ipad|ipod/i.test(ua) ? "iOS" : /windows/i.test(ua) ? "Windows" : /mac os/i.test(ua) ? "macOS" : /linux/i.test(ua) ? "Linux" : "";
  return os ? `${browser} · ${os}` : browser;
}
