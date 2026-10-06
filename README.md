# Nelvin Perks Pass

Plateforme d'avantages salariés, d'offres B2C et de cashback pour l'Afrique et le MENA.

- **Frontend** : React 18 + Vite + Tailwind (`src/`)
- **Backend** : [Supabase](https://supabase.com) — Postgres + Row Level Security, Auth, Storage, Realtime et Edge Functions (`supabase/`)

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev                  # http://localhost:5173
```

| Variable | Rôle |
| --- | --- |
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (publishable / anon). Les données sont protégées par RLS. |
| `VITE_SITE_URL` | URL publique du site (balises canonical / Open Graph) |

Vérifications : `npm run lint` et `npm run build`.

## Structure

```
src/api/            Accès Supabase : client, entités (tables), auth, Edge Functions, upload
src/lib/AuthContext Session + profil de l'utilisateur
src/pages, src/components
supabase/migrations Schéma SQL (tables, RLS, fonctions atomiques wallet/redemption, storage)
supabase/functions  Edge Functions Deno (paiements, redemptions, onboarding, IA support…)
```

### Rôles

`MEMBER` (particulier), `EMPLOYEE`, `HR_ADMIN` (entreprise), `MERCHANT` (partenaire), `SUPER_ADMIN`.
Le rôle est stocké dans `public.profiles` et ne peut être modifié que par un admin ou côté serveur.

Premier super admin :

```sql
update public.profiles set role = 'SUPER_ADMIN', onboarded = true where email = 'vous@exemple.com';
```

## Backend Supabase

### Base de données

Appliquer les migrations dans l'ordre (CLI ou éditeur SQL du dashboard) :

```bash
supabase link --project-ref wdxgflyhjhcevdruvfjb
supabase db push
```

- `20261006160000_archive_legacy_schema.sql` déplace l'ancien schéma `public` dans un schéma privé `legacy` (aucune suppression).
- `20261006160100_app_schema.sql` crée le schéma de l'application.

### Edge Functions

```bash
supabase functions deploy --no-verify-jwt
```

(`verify_jwt` est désactivé dans `supabase/config.toml` : chaque fonction vérifie elle-même l'utilisateur, ce qui permet aussi les clés `sb_publishable_…`.)

| Fonction | Rôle |
| --- | --- |
| `check-access` | Accès aux portails selon l'abonnement (entreprise / membre) |
| `setup-account` | Onboarding (rôle, création de l'entreprise) |
| `validate-invite-code` / `consume-invite-code` | Invitations salariés |
| `generate-redemption` / `validate-redemption` | Codes QR et validation marchand (cashback atomique) |
| `recharge-wallet` / `verify-payment` | Recharge wallet multi-PSP + confirmation |
| `withdraw-wallet` | Retrait (débit atomique) |
| `submit-partner-application` | Candidature partenaire |
| `nelvin-support` | Assistant IA (API Anthropic) |
| `list-pull-requests` | Page admin GitHub |
| `admin-invite-user` | Invitation d'un futur admin par email |

Secrets (`supabase secrets set NOM=valeur`) :

| Secret | Utilisé par |
| --- | --- |
| `APP_URL` | URL du site (redirections de paiement et invitations) |
| `ALLOWED_ORIGINS` | Optionnel : autres origines autorisées pour les retours de paiement (séparées par des virgules) |
| `STRIPE_SECRET_KEY`, `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`, `PADDLE_API_KEY`, `KORAPAY_SECRET_KEY` | PSP |
| `PAYUNIT_API_KEY`, `PAYUNIT_API_USERNAME`, `PAYUNIT_API_PASSWORD`, `PAYUNIT_MODE` | Payunit |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (optionnel) | Assistant IA |
| `GITHUB_TOKEN` | Page Pull requests |

### Auth (dashboard Supabase)

1. **Authentication → URL Configuration** : *Site URL* = l'URL du site ; ajouter `https://votre-domaine/**` (et `http://localhost:5173/**`) aux *Redirect URLs*.
2. **Authentication → Email Templates → Confirm signup** : l'app demande un **code à 6 chiffres**. Le modèle doit contenir `{{ .Token }}`, par exemple :
   `<p>Votre code Nelvin : <strong>{{ .Token }}</strong></p>`
3. **Authentication → Providers → Google** : activer et renseigner le client OAuth pour « Continuer avec Google ».

### Storage

Bucket public `nelvin-public` (images ≤ 10 Mo). Les visiteurs non connectés ne peuvent téléverser que dans `applications/` (candidature partenaire).

## Déploiement du frontend

Site statique (`npm run build` → `dist/`) déployable sur Vercel, Netlify, Cloudflare Pages…
Configurer la réécriture SPA (toutes les routes → `index.html`) et les variables `VITE_*`.
