// Web Push opt-in: subscribes this browser and registers it with the database.
import { supabase } from "./supabaseClient";
import { callRpc } from "./rpc";

export const pushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

const b64ToBytes = (s) => {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};
const bytesToB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function vapidKey() {
  const { data } = await supabase.from("platform_settings").select("value").eq("key", "vapid_public_key").maybeSingle();
  if (!data?.value) throw new Error("Push is not configured yet.");
  return String(data.value);
}

export async function currentPushState() {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  try {
    const reg = await navigator.serviceWorker.ready;
    return (await reg.pushManager.getSubscription()) ? "on" : "off";
  } catch { return "off"; }
}

export async function enablePush() {
  if (!pushSupported()) throw new Error("This browser does not support push notifications.");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Notifications are blocked for this site in your browser settings.");
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(await vapidKey()) }));
  await callRpc("save_push_subscription", {
    p_endpoint: sub.endpoint, p_p256dh: bytesToB64(sub.getKey("p256dh")), p_auth: bytesToB64(sub.getKey("auth")), p_ua: navigator.userAgent,
  });
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  try { await callRpc("delete_push_subscription", { p_endpoint: sub.endpoint }); } catch { /* removed server-side on next failed send */ }
  await sub.unsubscribe();
}
