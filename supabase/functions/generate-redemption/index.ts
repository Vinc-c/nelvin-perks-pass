// Creates a short-lived redemption code for an offer (persisted before it is shown).
import { adminClient, getCaller, json, readJson, serve, UUID_RE } from "../_shared/http.ts";

const TTL_SECONDS = 180;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function genCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let c = "";
  for (const b of bytes) c += CODE_CHARS[b % CODE_CHARS.length];
  return `NEL-${c}`;
}

serve(async (req) => {
  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Unauthorized" }, 401);

  const body = await readJson(req);
  const offerId = String(body.offer_id || "");
  if (!UUID_RE.test(offerId)) return json({ error: "Offre introuvable" }, 404);

  const { data: offer } = await admin
    .from("offers")
    .select("id, merchant_id, expires_at, target_audience, merchants!inner(verified_status)")
    .eq("id", offerId)
    .maybeSingle();
  if (!offer || !offer.merchant_id) return json({ error: "Offre introuvable" }, 404);
  // deno-lint-ignore no-explicit-any
  if ((offer as any).merchants?.verified_status !== "VERIFIED") {
    return json({ error: "Ce partenaire n'est pas encore actif" }, 403);
  }
  if (offer.expires_at && new Date(offer.expires_at) < new Date()) return json({ error: "Offre expirée" }, 410);
  if (offer.target_audience === "B2B_ONLY" && !caller.profile.company_id) {
    return json({ error: "Offre réservée aux salariés des entreprises partenaires" }, 403);
  }

  const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000).toISOString();
  // Retry on the (unlikely) unique-code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = genCode();
    const { data, error } = await admin
      .from("redemptions")
      .insert({
        user_id: caller.user.id,
        company_id: caller.profile.company_id,
        offer_id: offer.id,
        merchant_id: offer.merchant_id,
        code_used: code,
        code_type: "QR",
        status: "GENERATED",
        expires_at: expiresAt,
        created_by_id: caller.user.id,
      })
      .select("id")
      .single();
    if (!error) return json({ ok: true, code, redemption_id: data.id, expires_at: expiresAt, ttl: TTL_SECONDS });
    if (error.code !== "23505") throw error;
  }
  return json({ error: "Impossible de générer un code, réessayez." }, 503);
});
