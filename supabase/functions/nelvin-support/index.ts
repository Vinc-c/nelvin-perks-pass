// In-app AI support assistant.
// Uses the Anthropic Messages API — set ANTHROPIC_API_KEY (and optionally
// ANTHROPIC_MODEL) in the Edge Function secrets.
import { adminClient, getCaller, json, readJson, serve } from "../_shared/http.ts";

const ROLE_LABELS: Record<string, string> = {
  MEMBER: "un particulier (membre B2C) qui profite d'offres et de cashback",
  user: "un particulier (membre B2C) qui profite d'offres et de cashback",
  EMPLOYEE: "un salarié d'une entreprise cliente qui utilise ses avantages",
  HR_ADMIN: "un responsable RH / administrateur d'une entreprise cliente",
  MERCHANT: "un marchand partenaire qui gère ses offres et redemptions",
  SUPER_ADMIN: "un super administrateur de la plateforme Nelvin",
  admin: "un super administrateur de la plateforme Nelvin",
};

const SYSTEM_PROMPT = `Tu es Nelvin Support, l'assistant IA de la plateforme Nelvin Benefits — un programme d'avantages salariés, de cashback et d'offres B2C pour les villes africaines.
Ton rôle : aider l'utilisateur à naviguer la plateforme, expliquer comment fonctionnent les offres, le cashback, le wallet, les codes QR de redemption, les invitations d'employés, les abonnements, la validation partenaire, etc.
Sois cordial, clair et concis (max ~180 mots). Réponds en français. Si tu ne sais pas quelque chose de précis sur le compte de l'utilisateur, indique-lui à quelle section de son tableau de bord il peut se référer. Ne fournis jamais de données chiffrées inventées sur son compte.`;

serve(async (req) => {
  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Unauthorized" }, 401);

  const body = await readJson(req);
  const message = String(body.message || "").trim().slice(0, 1200);
  if (!message) return json({ error: "Message vide" }, 400);

  // Cost guard: daily message quota per user (platform setting support_chat_daily_limit, default 30).
  const { data: limitRow } = await admin.from("platform_settings").select("value").eq("key", "support_chat_daily_limit").maybeSingle();
  const dailyLimit = Math.max(1, Number(limitRow?.value) || 30);
  const { data: withinQuota } = await admin.rpc("chat_quota_take", { p_user: caller.user.id, p_limit: dailyLimit });
  if (withinQuota === false) {
    return json({ reply: "Vous avez atteint la limite quotidienne de messages avec l'assistant. Revenez demain ou consultez le Centre d'aide." });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return json({ reply: "L'assistant n'est pas encore configuré. Consultez le Centre d'aide ou contactez le support depuis votre tableau de bord." });
  }

  // Rebuild a clean alternating history ending with the new user message.
  const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
  const messages: { role: "user" | "assistant"; content: string }[] = [];
  for (const h of history as { role?: string; content?: unknown }[]) {
    const role = h?.role === "assistant" ? "assistant" : "user";
    const content = String(h?.content || "").slice(0, 1200);
    if (!content) continue;
    if (messages.length === 0 && role === "assistant") continue; // must start with user
    if (messages.length && messages[messages.length - 1].role === role) {
      messages[messages.length - 1].content += "\n" + content;
    } else {
      messages.push({ role, content });
    }
  }
  if (messages.length && messages[messages.length - 1].role === "user") messages.pop();
  messages.push({ role: "user", content: message });

  const roleLabel = ROLE_LABELS[caller.profile.role] || "un utilisateur de la plateforme Nelvin";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("ANTHROPIC_MODEL") || "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: `${SYSTEM_PROMPT}\n\nTu parles actuellement à ${roleLabel}.`,
      messages,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Anthropic error", res.status, data);
    return json({ reply: "Désolé, je n'ai pas pu générer de réponse. Réessayez dans un instant." });
  }
  const reply = (data.content || [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("\n")
    .trim();
  return json({ reply: reply || "Désolé, je n'ai pas pu générer de réponse. Réessayez." });
});
