// Creates a short-lived redemption code for an offer (persisted before it is shown).
import { adminClient, getCaller, json, readJson, serve, UUID_RE } from "../_shared/http.ts";
import { accessFor } from "../_shared/access.ts";

const DEFAULT_TTL_SECONDS = 180;
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

  const access = await accessFor(admin, caller.profile);
  if (!access.allowed) {
    return json({ error: "Votre accès aux offres a expiré : renouvelez votre abonnement.", reason: access.reason }, 402);
  }

  const body = await readJson(req);
  const offerId = String(body.offer_id || "");
  if (!UUID_RE.test(offerId)) return json({ error: "Offre introuvable" }, 404);

  const { data: offer } = await admin
    .from("offers")
    .select("id, merchant_id, expires_at, target_audience, required_plan, merchants!inner(verified_status)")
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

  if (offer.required_plan) {
    const { data: planOk } = await admin.rpc("offer_plan_ok", { p_user: caller.user.id, p_offer: offer.id });
    if (!planOk) {
      return json({
        error: `Ce privilège est réservé aux membres ${offer.required_plan === "PASS_VIP" ? "VIP Gold" : "Premium"} : passez à la formule supérieure pour en profiter.`,
        reason: "PLAN_REQUIRED", required_plan: offer.required_plan,
      }, 403);
    }
  }

  // Per-member usage limit (e.g. buy-one-get-one once a year).
  const { data: remaining } = await admin.rpc("offer_usage_remaining", { p_user: caller.user.id, p_offer: offer.id });
  if (remaining === 0) {
    return json({ error: "Vous avez déjà utilisé cette offre le nombre de fois autorisé pour la période.", reason: "LIMIT_REACHED" }, 409);
  }

  const { data: ttlRow } = await admin.from("platform_settings").select("value").eq("key", "redemption_ttl_seconds").maybeSingle();
  const ttl = Math.min(Math.max(Number(ttlRow?.value) || DEFAULT_TTL_SECONDS, 60), 900);
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
  // The member explicitly allows the merchant to charge this code to their wallet.
  const walletAuthorized = body.allow_wallet_payment === true;
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
        wallet_payment_authorized: walletAuthorized,
        created_by_id: caller.user.id,
      })
      .select("id")
      .single();
    if (!error) return json({ ok: true, code, redemption_id: data.id, expires_at: expiresAt, ttl, wallet_payment_authorized: walletAuthorized });
    if (error.code !== "23505") throw error;
  }
  return json({ error: "Impossible de générer un code, réessayez." }, 503);
});
