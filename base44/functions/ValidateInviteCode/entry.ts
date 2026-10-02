import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const code = (body && body.code ? String(body.code) : '').trim().toUpperCase();
    const email = (body && body.email ? String(body.email) : '').trim().toLowerCase();

    if (!code) return Response.json({ valid: false, error: 'Invite code is required' }, { status: 400 });

    const found = await base44.asServiceRole.entities.InviteCode.filter({ code });
    const invite = Array.isArray(found) ? found[0] : null;
    if (!invite) return Response.json({ valid: false, error: 'Invalid invite code' }, { status: 404 });
    if (invite.status && invite.status !== 'PENDING') {
      return Response.json({ valid: false, error: 'This code has already been used or revoked' }, { status: 410 });
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return Response.json({ valid: false, error: 'This invite code has expired' }, { status: 410 });
    }
    if (invite.target_email && email && invite.target_email.toLowerCase() !== email) {
      return Response.json({ valid: false, error: 'This invite code is not for this email address' }, { status: 403 });
    }

    return Response.json({
      valid: true,
      code_id: invite.id,
      company_id: invite.company_id,
      role: invite.role || 'EMPLOYEE',
      target_email: invite.target_email || null,
      target_name: invite.target_name || null
    });
  } catch (error) {
    return Response.json({ valid: false, error: error.message }, { status: 500 });
  }
}