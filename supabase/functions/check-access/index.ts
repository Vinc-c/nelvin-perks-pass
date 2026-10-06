// UI gate for the transactional portal pages (same rules are enforced
// server-side in generate-redemption). See _shared/access.ts.
import { adminClient, getCaller, json, serve } from "../_shared/http.ts";
import { accessFor } from "../_shared/access.ts";

serve(async (req) => {
  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Unauthorized" }, 401);
  return json(await accessFor(admin, caller.profile));
});
