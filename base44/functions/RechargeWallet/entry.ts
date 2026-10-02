import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { routePayment, initPayment } from '../../shared/paymentRouter.ts';

const AUDIENCE_BY_ROLE: Record<string, string> = {
  MEMBER: 'B2C', user: 'B2C', EMPLOYEE: 'B2C',
  HR_ADMIN: 'B2B', MERCHANT: 'B2B', SUPER_ADMIN: 'B2C', admin: 'B2C',
};

const VALID_METHODS = ['CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'APPLE_PAY', 'GOOGLE_PAY'];

function genRef(pspId: string) {
  return `NELVIN-${pspId.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
      return Response.json({ error: 'Montant invalide' }, { status: 400 });
    }
    const method = String(body.method || 'CARD').toUpperCase();
    if (!VALID_METHODS.includes(method)) {
      return Response.json({ error: 'Méthode de paiement invalide' }, { status: 400 });
    }
    const currency = String(body.currency || (user as any).wallet_currency || 'USD').slice(0, 8);
    const country = String(body.country || (user as any).country || '').slice(0, 60);
    const callbackUrl = String(body.callback_url || '').slice(0, 300);
    if (!callbackUrl.startsWith('http')) {
      return Response.json({ error: 'callback_url requis (URL de retour)' }, { status: 400 });
    }
    const audience = AUDIENCE_BY_ROLE[(user as any).role] || 'B2C';

    // 1. Route to the optimal PSP for this context.
    const route = routePayment({ audience, method, country, currency });
    const psp = route.primary;
    const reference = genRef(psp.id);

    // 2. Record a PENDING recharge transaction (credited on confirmation).
    const tx = await base44.asServiceRole.entities.Transaction.create({
      user_id: user.id,
      company_id: (user as any).company_id || '',
      amount,
      currency,
      psp_reference: reference,
      payment_method: method,
      type: 'RECHARGE',
      status: 'PENDING',
    });

    // 3. Initialize the real hosted-checkout session with the selected PSP.
    let session;
    try {
      session = await initPayment(psp.id, {
        amount,
        currency,
        email: (user as any).email || '',
        reference,
        callback_url: callbackUrl,
        metadata: { user_id: user.id, name: (user as any).full_name || '' },
      });
    } catch (e) {
      // PSP init failed (e.g. secret missing) — mark the transaction failed.
      await base44.asServiceRole.entities.Transaction.update(tx.id, { status: 'FAILED' });
      return Response.json({ error: (e as Error).message, psp: psp.name }, { status: 502 });
    }

    return Response.json({
      ok: true,
      psp: psp.name,
      pspId: psp.id,
      reason: route.reason,
      reference,
      transactionId: tx.id,
      authorization_url: session.authorization_url,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}