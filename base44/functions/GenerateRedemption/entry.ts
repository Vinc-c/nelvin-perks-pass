import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Server-side generation of a redemption code. Creating the Redemption record
// here (service role) avoids the client-side RLS fragility for members with no
// company_id and guarantees the code is persisted before it is shown — a code
// shown but not persisted would be unredeemable.

const TTL_SECONDS = 180;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function genCode() {
  let c = "";
  for (let i = 0; i < 6; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return `NEL-${c}`;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const offerId = String(body.offer_id || '').slice(0, 60);
    if (!offerId) return Response.json({ error: 'offer_id requis' }, { status: 400 });

    const offer = await base44.asServiceRole.entities.Offer.get(offerId).catch(() => null);
    if (!offer || !offer.merchant_id) {
      return Response.json({ error: 'Offre introuvable' }, { status: 404 });
    }
    if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
      return Response.json({ error: 'Offre expirée' }, { status: 410 });
    }

    const code = genCode();
    const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000).toISOString();

    const redemption = await base44.asServiceRole.entities.Redemption.create({
      user_id: user.id,
      company_id: (user as any).company_id || '',
      offer_id: offerId,
      merchant_id: offer.merchant_id,
      code_used: code,
      code_type: 'QR',
      status: 'GENERATED',
      cashback_credited: 0,
      discount_applied: 0,
      expires_at: expiresAt,
    });

    return Response.json({
      ok: true,
      code,
      redemption_id: redemption.id,
      expires_at: expiresAt,
      ttl: TTL_SECONDS,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}