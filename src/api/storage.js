// Public file uploads (logos, covers, offer visuals, CMS images) to Supabase Storage.
import { supabase } from "./supabaseClient";
import { translate } from "@/i18n/translate";

export const PUBLIC_BUCKET = "nelvin-public";
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Uploads a file and returns `{ file_url }` (public URL).
 * `folder` groups files; anonymous visitors may only upload into "applications".
 */
export async function uploadPublicFile(file, folder = "uploads") {
  if (!file) throw new Error(translate("err.noFile"));
  if (file.size > MAX_BYTES) throw new Error("Fichier trop volumineux (10 Mo max)");
  if (file.type && !file.type.startsWith("image/")) throw new Error(translate("err.imagesOnly"));

  const ext = (file.name?.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(PUBLIC_BUCKET)
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type || undefined });
  if (error) throw new Error(error.message || translate("err.upload"));

  const { data } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(path);
  return { file_url: data.publicUrl, path };
}

export const KYC_BUCKET = "kyc-private";
const KYC_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

/** Uploads a KYC document into the merchant's private folder. */
export async function uploadKycFile(file, merchantId) {
  if (!file) throw new Error(translate("err.noFile"));
  if (file.size > MAX_BYTES) throw new Error("Fichier trop volumineux (10 Mo max)");
  if (file.type && !KYC_TYPES.includes(file.type)) throw new Error(translate("err.kycFormats"));
  const ext = (file.name?.split(".").pop() || "pdf").toLowerCase().replace(/[^a-z0-9]/g, "") || "pdf";
  const path = `${merchantId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(KYC_BUCKET).upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) throw new Error(error.message || translate("err.upload"));
  return { path };
}

/** Short-lived link to view a private KYC document (owner merchant or admin). */
export async function kycSignedUrl(path, expiresIn = 300) {
  const { data, error } = await supabase.storage.from(KYC_BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw new Error(error.message || "Lien indisponible");
  return data.signedUrl;
}

export async function removeKycFile(path) {
  await supabase.storage.from(KYC_BUCKET).remove([path]);
}

export const MEDIA_BUCKET = "nelvin-media";
export const MAX_VIDEO_BYTES = 5 * 1024 * 1024;
const MEDIA_TYPES = ["video/mp4", "video/webm", "image/png", "image/jpeg", "image/webp", "image/avif"];

/** Admin-only upload of a hero image or video (MP4 / WebM, 5 MB max). Returns `{ file_url, media_type }`. */
export async function uploadMediaFile(file, folder = "hero") {
  if (!file) throw new Error(translate("err.noFile"));
  const isVideo = file.type.startsWith("video/");
  if (!MEDIA_TYPES.includes(file.type)) throw new Error("Use MP4 or WebM for videos, or JPG, PNG, WebP for images.");
  if (isVideo ? file.size > MAX_VIDEO_BYTES : file.size > MAX_BYTES) throw new Error(isVideo ? "Video too large (5 MB max). Shorten it or lower its resolution." : "Image too large (10 MB max)");
  const ext = (file.name?.split(".").pop() || (isVideo ? "mp4" : "jpg")).toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (error) throw new Error(error.message || translate("err.upload"));
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return { file_url: data.publicUrl, path, media_type: isVideo ? "video" : "image" };
}

/** Grabs a still frame from a local video file (used as poster and as the no-autoplay fallback). */
export function videoPosterBlob(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = url;
    const done = (fn, arg) => { URL.revokeObjectURL(url); fn(arg); };
    v.onerror = () => done(reject, new Error("This video cannot be read by the browser. Export it as H.264 MP4 or WebM."));
    v.onloadedmetadata = () => { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); };
    v.onseeked = () => {
      const w = Math.min(v.videoWidth, 1600); const h = Math.round((w / v.videoWidth) * v.videoHeight);
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      c.getContext("2d").drawImage(v, 0, 0, w, h);
      c.toBlob((b) => (b ? done(resolve, { blob: b, width: v.videoWidth, height: v.videoHeight, duration: v.duration }) : done(reject, new Error("Poster failed"))), "image/jpeg", 0.82);
    };
  });
}
