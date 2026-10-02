import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Public read of the platform CMS content (logos, hero/marketing images, copy).
// No auth required — runs as service role so the public landing page can render
// admin-managed content without exposing the entity collections directly.
export default async function (_req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(_req);
    const [logos, images, copy] = await Promise.all([
      base44.asServiceRole.entities.PartnerLogo.list('-sort_order', 500),
      base44.asServiceRole.entities.SiteImage.filter({ active: true }),
      base44.asServiceRole.entities.SiteCopy.list('-created_date', 500),
    ]);
    return Response.json({
      logos: (logos || []).filter((l) => l.active !== false),
      images: images || [],
      copy: copy || [],
    });
  } catch (error) {
    return Response.json({ logos: [], images: [], copy: [] });
  }
}