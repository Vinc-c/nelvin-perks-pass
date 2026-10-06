// Public file uploads (logos, covers, offer visuals, CMS images) to Supabase Storage.
import { supabase } from "./supabaseClient";

export const PUBLIC_BUCKET = "nelvin-public";
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Uploads a file and returns `{ file_url }` (public URL).
 * `folder` groups files; anonymous visitors may only upload into "applications".
 */
export async function uploadPublicFile(file, folder = "uploads") {
  if (!file) throw new Error("Aucun fichier sélectionné");
  if (file.size > MAX_BYTES) throw new Error("Fichier trop volumineux (10 Mo max)");
  if (file.type && !file.type.startsWith("image/")) throw new Error("Seules les images sont acceptées");

  const ext = (file.name?.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(PUBLIC_BUCKET)
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type || undefined });
  if (error) throw new Error(error.message || "Échec du téléversement");

  const { data } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(path);
  return { file_url: data.publicUrl, path };
}
