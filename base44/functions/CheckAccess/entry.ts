import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const ADMIN_ROLES = ['SUPER_ADMIN', 'admin'];
const TRIAL_DAYS = 30;

// A subscription record is currently active if it is ACTIVE/TRIALING and not past its expiry.
function isSubscriptionActive(s: any): boolean {
  if (!s) return false;
  if (s.status !== 'ACTIVE' && s.status !== 'TRIALING') return false;
  if (s.expires_at && new Date(s.expires_at) < new Date()) return false;
  return true;
}

// Determines whether the current user may access the platform's authenticated
// portals. Admins and merchants always pass. HR/employees are gated by their
// company's subscription (active or within the 30-day trial). Members are gated
// by their membership subscription — but only blocked when a subscription they
// once had has ended (no active one); members with no subscription record are
// left untouched so the free tier keeps working.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (ADMIN_ROLES.includes(user.role)) return Response.json({ allowed: true });

    if (user.role === 'MERCHANT') return Response.json({ allowed: true });

    if (user.role === 'HR_ADMIN' || user.role === 'EMPLOYEE') {
      if (!user.company_id) return Response.json({ allowed: false, reason: 'no_company' });
      const company = await base44.asServiceRole.entities.Company.get(user.company_id).catch(() => null);
      if (!company) return Response.json({ allowed: false, reason: 'no_company' });
      const status = company.subscription_status;
      if (status === 'ACTIVE') return Response.json({ allowed: true, company });
      if (status === 'TRIAL') {
        const created = new Date(company.created_date || company.updated_date || Date.now());
        const days = (Date.now() - created.getTime()) / 86400000;
        if (days <= TRIAL_DAYS) return Response.json({ allowed: true, company, trial: true });
        return Response.json({ allowed: false, reason: 'trial_expired', company });
      }
      return Response.json({ allowed: false, reason: status === 'CANCELLED' ? 'cancelled' : 'expired', company });
    }

    // Member (particulier) membership gate.
    const subs = await base44.asServiceRole.entities.Subscription
      .filter({ user_id: user.id }, '-created_date', 50)
      .catch(() => []);
    if (!subs || subs.length === 0) return Response.json({ allowed: true });
    const hasActive = subs.some(isSubscriptionActive);
    if (hasActive) return Response.json({ allowed: true });
    return Response.json({ allowed: false, reason: 'membership_expired' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}