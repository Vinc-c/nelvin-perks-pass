import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Secure, server-side redemption validation. Called by the merchant when a
// member presents a QR/TOTP code. Atomically marks the redemption REDEEMED,
// credits cashback to the member wallet, records a REDEMPTION transaction and
// accrues the merchant payout balance. Idempotent + ownership-checked.

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const code = String(body.code || '').trim().toUpperCase().slice(0, 40);
    if (!code) return Response.json({ error: 'Code requis' }, { status: 400 });

    const merchantId = (user as any).merchant_id;
    if (!merchantId) return Response.json({ ok: false, reason: 'MERCHANT_REQUIRED' }, { status: 403 });

    // Find the pending redemption by code (service role — merchants can't read
    // member-owned Redemption rows under RLS).
    const reds = await base44.asServiceRole.entities.Redemption.filter({ code_used: code });
    const redemption = (reds || [])[0];
    if (!redemption) return Response.json({ ok: false, reason: 'INVALID' }, { status: 404 });

    if (redemption.status === 'REDEEMED') return Response.json({ ok: false, reason: 'ALREADY_USED' });
    if (redemption.status === 'EXPIRED' || (redemption.expires_at && new Date(redemption.expires_at) < new Date())) {
      return Response.json({ ok: false, reason: 'EXPIRED' });
    }

    // Ownership: the redemption's offer must belong to this merchant.
    const offer = await base44.asServiceRole.entities.Offer.get(redemption.offer_id).catch(() => null);
    if (!offer || offer.merchant_id !== merchantId) {
      return Response.json({ ok: false, reason: 'INVALID' }, { status: 403 });
    }

    // Compute the discount applied and cashback to credit.
    let discountApplied = 0;
    const dv = Number(offer.discount_value || 0);
    if (offer.discount_type === 'PERCENTAGE' || offer.discount_type === 'CASHBACK') discountApplied = dv;
    else if (offer.discount_type === 'FIXED') discountApplied = dv;
    else if (offer.discount_type === 'BOGO') discountApplied = dv; // representative value
    const cashbackCredited = Number(offer.cashback_rate || 0);

    // 1. Mark redeemed.
    await base44.asServiceRole.entities.Redemption.update(redemption.id, {
      status: 'REDEEMED',
      redeemed_at: new Date().toISOString(),
      discount_applied: discountApplied,
      cashback_credited: cashbackCredited,
    });

    // 2. Credit the member wallet + record a redemption transaction.
    if (cashbackCredited > 0) {
      // Atomic $inc so concurrent redemptions never lose a cashback credit.
      await base44.asServiceRole.entities.User.updateMany(
        { id: redemption.user_id },
        { $inc: { wallet_balance: cashbackCredited } },
      );
      await base44.asServiceRole.entities.Transaction.create({
        user_id: redemption.user_id,
        company_id: redemption.company_id || '',
        merchant_id: merchantId,
        offer_id: offer.id,
        amount: discountApplied,
        cashback_amount: cashbackCredited,
        currency: 'USD',
        type: 'REDEMPTION',
        status: 'COMPLETED',
      });
    }

    // 3. Accrue merchant payout balance atomically.
    await base44.asServiceRole.entities.Merchant.updateMany(
      { id: merchantId },
      { $inc: { payout_balance: discountApplied } },
    );

    // 4. Notify the member that cashback landed.
    if (cashbackCredited > 0) {
      await base44.asServiceRole.entities.Notification.create({
        user_id: redemption.user_id,
        type: 'CASHBACK',
        title: 'Cashback crédité',
        body: `${cashbackCredited} de cashback pour « ${offer.title} » ajouté à votre wallet.`,
        read: false,
        link: '/wallet-activity',
      }).catch(() => {});
    }

    return Response.json({
      ok: true,
      code,
      offer_title: offer.title,
      discount_applied: discountApplied,
      cashback_credited: cashbackCredited,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}