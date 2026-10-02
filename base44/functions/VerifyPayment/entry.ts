import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { verifyPayment } from '../../shared/paymentRouter.ts';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const psp = String(body.psp || '').toLowerCase();
    const ref = String(body.ref || '').slice(0, 120);
    const providerRef = body.provider_ref ? String(body.provider_ref).slice(0, 120) : undefined;

    if (!psp || !ref) {
      return Response.json({ error: 'psp et ref requis' }, { status: 400 });
    }

    // Confirm the payment with the PSP.
    const result = await verifyPayment(psp, ref, providerRef);

    // Look up the pending recharge transaction for this reference.
    const txs = await base44.asServiceRole.entities.Transaction.filter({ psp_reference: ref, type: 'RECHARGE' });
    const tx = (txs || [])[0];
    if (!tx) {
      return Response.json({ ok: false, status: result.status, error: 'Transaction introuvable' }, { status: 404 });
    }

    // Idempotent: only credit once.
    if (tx.status === 'COMPLETED') {
      return Response.json({ ok: true, status: 'already_completed', balance: null, transactionId: tx.id });
    }

    if (!result.ok) {
      await base44.asServiceRole.entities.Transaction.update(tx.id, { status: 'FAILED' });
      return Response.json({ ok: false, status: result.status, error: 'Paiement non confirmé' }, { status: 402 });
    }

    // Confirm + credit the wallet atomically. $inc avoids lost updates when
    // two recharges (or a redemption) land at the same moment.
    await base44.asServiceRole.entities.Transaction.update(tx.id, { status: 'COMPLETED' });
    await base44.asServiceRole.entities.User.updateMany(
      { id: tx.user_id },
      { $inc: { wallet_balance: Number(tx.amount) }, $set: { wallet_currency: tx.currency } },
    );
    const user = await base44.asServiceRole.entities.User.get(tx.user_id);
    const newBalance = Number((user as any).wallet_balance || 0);

    // Notify the user that the recharge succeeded.
    await base44.asServiceRole.entities.Notification.create({
      user_id: tx.user_id,
      type: 'RECHARGE',
      title: 'Recharge confirmée',
      body: `Votre wallet a été rechargé de ${tx.amount} ${tx.currency}.`,
      read: false,
      link: '/wallet-activity',
    }).catch(() => {});

    return Response.json({ ok: true, status: 'completed', balance: newBalance, amount: tx.amount, currency: tx.currency, transactionId: tx.id });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}