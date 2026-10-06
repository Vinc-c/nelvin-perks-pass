# AGENTS.md

## Project Context

Nelvin Perks Pass — React + Vite frontend on a Supabase backend. Treat it as
user-owned application code, keep changes focused on the request, and
preserve existing conventions. Start with `README.md` for setup.

## Key Files

- `src/api/supabaseClient.js`: the single Supabase client.
- `src/api/entities.js`: table access (`entities.Offer.filter(...)`, etc.).
- `src/api/auth.js`: sign in/up, OTP, Google, password reset, profile updates.
- `src/api/functions.js`: `invokeFunction(name, body)` for Edge Functions.
- `src/api/storage.js`: `uploadPublicFile(file, folder)`.
- `supabase/migrations/`: schema + RLS. Add a new migration for every schema change; never edit an applied one.
- `supabase/functions/`: Deno Edge Functions; shared code in `_shared/`.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Authorization lives in Postgres RLS policies and in the Edge Functions — never rely on the UI alone.
- Money movements (wallet, cashback, payouts) go through the SECURITY DEFINER SQL functions (`redeem_code`, `complete_recharge`, `withdraw_from_wallet`), never through client writes.
- Keep `src/lib/paymentRouter.js` and `supabase/functions/_shared/paymentRouter.ts` in sync.
- Run `npm run lint` and `npm run build` before finishing code changes.
