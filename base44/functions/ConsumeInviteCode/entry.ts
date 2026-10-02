import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const codeId = body && body.code_id ? String(body.code_id) : '';
    if (!codeId) return Response.json({ error: 'code_id is required' }, { status: 400 });

    const invite = await base44.asServiceRole.entities.InviteCode.get(codeId);
    if (!invite) return Response.json({ error: 'Invalid invite code' }, { status: 404 });
    if (invite.status && invite.status !== 'PENDING') {
      return Response.json({ error: 'This invite code is no longer available' }, { status: 410 });
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return Response.json({ error: 'This invite code has expired' }, { status: 410 });
    }
    if (invite.target_email && user.email && invite.target_email.toLowerCase() !== user.email.toLowerCase()) {
      return Response.json({ error: 'This invite code is not for your account' }, { status: 403 });
    }

    // Link the employee to the company tenant and assign their role.
    const role = invite.role || 'EMPLOYEE';
    await base44.asServiceRole.entities.User.update(user.id, {
      company_id: invite.company_id,
      role
    });

    // Mark the invite as consumed.
    await base44.asServiceRole.entities.InviteCode.update(codeId, {
      status: 'USED',
      redeemed_by_id: user.id
    });

    return Response.json({ ok: true, company_id: invite.company_id, role });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}