// Links the freshly verified employee to their company (atomic, single use).
import { adminClient, getCaller, json, readJson, serve, UUID_RE } from "../_shared/http.ts";

serve(async (req) => {
  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Unauthorized" }, 401);

  const body = await readJson(req);
  const codeId = String(body.code_id || "");
  if (!UUID_RE.test(codeId)) return json({ error: "code_id is required" }, 400);

  const { data, error } = await admin.rpc("consume_invite_code", {
    p_code_id: codeId,
    p_user_id: caller.user.id,
    p_email: caller.user.email ?? "",
  });
  if (error) throw error;
  if (!data?.ok) return json({ error: data?.error || "Invalid invite code" }, 410);

  if (body.full_name) {
    await admin.from("profiles").update({ full_name: String(body.full_name).slice(0, 120) })
      .eq("id", caller.user.id).is("full_name", null);
  }
  return json(data);
});
