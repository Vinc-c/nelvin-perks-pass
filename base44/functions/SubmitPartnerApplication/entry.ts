import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const data = await req.json();

    const required = [
      'email', 'brandName', 'contactName', 'contactPhone',
      'description', 'supportEmail', 'website',
      'logoUrl', 'coverUrl',
      'offerHeadline', 'offerHowToUse', 'productUrl', 'offerRedeemable', 'offerExpiry',
      'category', 'countries'
    ];
    for (const f of required) {
      if (!data[f]) return Response.json({ error: `Missing required field: ${f}` }, { status: 400 });
    }
    if (!Array.isArray(data.countries) || data.countries.length === 0) {
      return Response.json({ error: 'At least one country is required' }, { status: 400 });
    }
    if (!Array.isArray(data.termsConfirmed) || data.termsConfirmed.filter(Boolean).length < 4) {
      return Response.json({ error: 'Please confirm all terms & conditions' }, { status: 400 });
    }
    if (data.brandName.length > 120 || data.description.length > 2000) {
      return Response.json({ error: 'Input too long' }, { status: 400 });
    }

    const merchant = await base44.asServiceRole.entities.Merchant.create({
      name: data.brandName,
      category: data.category,
      country: data.countries[0],
      city: data.city || '',
      address: data.address || '',
      logo_url: data.logoUrl,
      cover_image_url: data.coverUrl,
      contact_email: data.email,
      contact_name: data.contactName,
      contact_phone: data.contactPhone,
      description: data.description,
      website: data.website,
      instagram: data.instagram || '',
      facebook: data.facebook || '',
      whatsapp: data.whatsapp || '',
      offer_headline: data.offerHeadline,
      offer_how_to_use: data.offerHowToUse,
      product_image_url: data.productUrl,
      offer_redeemable: data.offerRedeemable,
      offer_terms: data.offerTerms || '',
      offer_expiry: data.offerExpiry,
      offer_countries: data.countries.join(', '),
      application_notes: data.notes || '',
      verified_status: 'PENDING'
    });

    // Link the brand to the logged-in applicant and turn them into a merchant
    // awaiting Nelvin validation. Anonymous applicants are left unlinked.
    try {
      const user = await base44.auth.me();
      if (user && !user.merchant_id) {
        const isAdmin = ['SUPER_ADMIN', 'admin'].includes(user.role);
        await base44.asServiceRole.entities.User.update(user.id, {
          merchant_id: merchant.id,
          ...(isAdmin ? {} : { role: 'MERCHANT', account_type: 'marchand', onboarded: true }),
        });
      }
    } catch (_) {
      // Anonymous applicant — nothing to link.
    }

    return Response.json({ ok: true, merchantId: merchant.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}