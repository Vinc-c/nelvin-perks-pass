import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const ROLE_BY_TYPE = { particulier: 'MEMBER', marchand: 'MERCHANT', entreprise: 'HR_ADMIN' };
const HOME = {
  MEMBER: '/member',
  MERCHANT: '/merchant-dashboard',
  HR_ADMIN: '/hr',
  EMPLOYEE: '/employee',
  SUPER_ADMIN: '/admin',
  admin: '/admin',
};
const LOCKED_ROLES = ['SUPER_ADMIN', 'admin', 'EMPLOYEE', 'HR_ADMIN', 'MERCHANT'];

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Already-configured accounts (admins, invited employees, finished onboarding) keep their role.
    if (user.onboarded || LOCKED_ROLES.includes(user.role)) {
      return Response.json({ ok: true, role: user.role, home: HOME[user.role] || '/member' });
    }

    const body = await req.json().catch(() => ({}));
    const type = String(body.account_type || '');
    const role = ROLE_BY_TYPE[type];
    if (!role) return Response.json({ error: 'Invalid account type' }, { status: 400 });

    const phone = String(body.phone || '').trim().slice(0, 30);
    const updates: Record<string, unknown> = { role, account_type: type, onboarded: true };
    if (phone) updates.phone = phone;

    if (role === 'HR_ADMIN') {
      const name = String(body.company_name || '').trim();
      if (!name) return Response.json({ error: 'Company name is required' }, { status: 400 });
      if (name.length > 120) return Response.json({ error: 'Company name is too long' }, { status: 400 });
      const country = String(body.country || '').trim().slice(0, 60);
      const company = await base44.asServiceRole.entities.Company.create({
        name,
        country,
        contact_email: user.email,
        plan_tier: 'STARTER',
        subscription_status: 'TRIAL',
        seats_used: 1,
      });
      updates.company_id = company.id;
    }

    await base44.asServiceRole.entities.User.update(user.id, updates);
    return Response.json({ ok: true, role, home: HOME[role] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}