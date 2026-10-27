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
