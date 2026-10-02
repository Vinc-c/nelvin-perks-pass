import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const ROLE_LABELS = {
  MEMBER: "un particulier (membre B2C) qui profite d'offres et de cashback",
  user: "un particulier (membre B2C) qui profite d'offres et de cashback",
  EMPLOYEE: "un salarié d'une entreprise cliente qui utilise ses avantages",
  HR_ADMIN: "un responsable RH / administrateur d'une entreprise cliente",
  MERCHANT: "un marchand partenaire qui gère ses offres et redemptions",
  SUPER_ADMIN: "un super administrateur de la plateforme Nelvin",
  admin: "un super administrateur de la plateforme Nelvin",
};

const SYSTEM_PROMPT = `Tu es Nelvin Support, l'assistant IA de la plateforme Nelvin Benefits — un programme d'avantages salariés, de cashback et d'offres B2C pour l'Afrique et le MENA.
Ton rôle : aider l'utilisateur à naviguer la plateforme, expliquer comment fonctionnent les offres, le cashback, le wallet, les codes QR de redemption, les invitations d'employés, les abonnements, la validation partenaire, etc.
Sois cordial, clair et concis (max ~180 mots). Réponds en français. Si tu ne sais pas quelque chose de précis sur le compte de l'utilisateur, indique-lui à quelle section de son tableau de bord il peut se référer. Ne fournis jamais de données chiffrées inventées sur son compte.`;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const message = String(body.message || '').trim().slice(0, 1200);
    if (!message) return Response.json({ error: 'Message vide' }, { status: 400 });

    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
    const roleLabel = ROLE_LABELS[user.role] || 'un utilisateur de la plateforme Nelvin';

    const convo = history
      .map((h) => `${h.role === 'assistant' ? 'Assistant' : 'User'}: ${String(h.content || '').slice(0, 1200)}`)
      .join('\n');

    const prompt = `${SYSTEM_PROMPT}\n\nTu parles actuellement à ${roleLabel}.\n\n${convo}\n\nUser: ${message}\n\nAssistant:`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_8_flash',
    });

    let reply: string;
    if (typeof result === 'string') reply = result;
    else if (result && typeof result === 'object') reply = (result as any).content || (result as any).text || (result as any).reply || JSON.stringify(result);
    else reply = "Désolé, je n'ai pas pu générer de réponse. Réessayez.";

    return Response.json({ reply });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}