# Nelvin Perks Pass

Plateforme multi-tenant d'avantages salariés, d'offres B2C et de cashback pour l'Afrique.

> **Plateforme conçue et développée par [liafrik.com](https://liafrik.com).**

- **Frontend** : React 18 + Vite + Tailwind (`src/`)
- **Backend** : [Supabase](https://supabase.com) — Postgres + Row Level Security, Auth (email/OTP, Google, 2FA TOTP), Storage, Realtime, Vault et Edge Functions (`supabase/`)

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
| `VITE_MAP_TILE_URL` | Facultatif. Tuiles de la carte (défaut : OpenStreetMap). À définir vers un fournisseur commercial à fort trafic. |
| `VITE_MAP_TILE_ATTRIBUTION` | Facultatif. Mention de copyright du fournisseur de tuiles. |

Vérifications : `npm run lint` et `npm run build`.

## Architecture

```
src/api/            Accès Supabase : client, entités (tables), RPC, auth (+2FA), Edge Functions, storage
src/hooks/          Données partagées : devises, plans, catalogue, récompenses…
src/lib/            Session (AuthContext), routage PSP, reçus PDF, navigation des portails
src/components/admin  Back-office super admin (PSP, paiements, plans, devises, staff, audit…)
supabase/migrations Schéma SQL, RLS, fonctions atomiques (argent, abonnements, redemptions)
supabase/functions  Edge Functions Deno (checkout, vérification paiement, retraits, redemptions…)
```

### Rôles et portails

| Rôle | Portail |
| --- | --- |
| `MEMBER` | Particulier abonné (offres, wallet, cashback, parrainage) |
| `EMPLOYEE` | Salarié d'une entreprise cliente (offres, allocations, reconnaissance) |
| `HR_ADMIN` | RH d'une entreprise (invitations, sièges, budget, avantages flexibles, rapports) |
| `MERCHANT` | Partenaire (offres, validation en caisse, KYC, demandes de paiement) |
| `SUPER_ADMIN` | Équipe Nelvin (toute la plateforme) |

Le rôle est stocké dans `public.profiles` et n'est jamais modifiable par l'utilisateur lui-même.

## Super admins

L'accès super admin est piloté **uniquement** par la table `public.platform_admins` (liste d'emails) :

- comptes initiaux : **ngomomaxin348@gmail.com** et **vinc.c@aol.com** ;
- d'autres super admins s'ajoutent depuis *Admin → Plateforme → Super Admins* (sans limite) ; une invitation email peut être envoyée ;
- un email ajouté est promu immédiatement s'il a déjà un compte, sinon dès son inscription ; un email retiré est rétrogradé ;
- la base refuse de descendre sous **2** super admins et interdit de se retirer soi-même ;
- la **2FA (TOTP) est obligatoire** pour les super admins et les RH (réglable dans *Paramètres plateforme*) : à la première connexion, l'activation est imposée, avec **10 codes de secours** à usage unique ; sans session vérifiée (`aal2`), aucun droit admin n'existe, en base comme dans les Edge Functions ;
- téléphone perdu : un code de secours retire l'ancien authentificateur (fonction `mfa-recover`) ; secours ultime en SQL : `update public.platform_settings set value = '[]' where key = 'mfa_required_roles';` ;
- toutes les actions sensibles sont tracées dans `admin_audit_log` (*Journal d'audit*).

## Multi-tenant : isolation stricte

L'isolation est appliquée **en base** (RLS + fonctions `SECURITY DEFINER`), jamais seulement dans l'interface :

- une entreprise (tenant) ne voit que ses propres salariés, invitations, politiques d'avantages, allocations, reconnaissances et transactions d'entreprise ; les transactions personnelles des salariés (recharges, retraits) restent privées ;
- un RH ne peut modifier que le nom/les informations de sa propre entreprise ; plan, statut, sièges et solde sont réservés à Nelvin (`guard_company_update`) ;
- un partenaire ne voit que ses offres, ses redemptions, ses documents KYC (stockage privé préfixé par son identifiant) et ses demandes de paiement ;
- un membre ne voit que ses propres données ; les offres publiques n'exposent que des partenaires vérifiés ;
- les mouvements d'argent passent exclusivement par des fonctions SQL atomiques et idempotentes.

## Clés PSP (prestataires de paiement)

Les clés se saisissent dans *Admin → Paiements → Clés PSP & routage* :

- Stripe, Paystack, Flutterwave, Payunit, Paddle, Korapay : activation, mode test/live, priorité, clé publique ;
- les clés secrètes sont chiffrées dans **Supabase Vault** (`admin_set_psp_secret`) ; l'interface n'affiche qu'un masque (`••••abcd`) et elles ne sont lisibles que par les Edge Functions (rôle service) ;
- bouton **Tester la connexion** (fonction `psp-test`) et simulateur de routage (pays / moyen / audience) ;
- **webhooks** : chaque carte PSP affiche l'URL `…/functions/v1/payment-webhook?psp=<id>` à coller dans le tableau de bord du PSP (Payunit et Korapay la reçoivent automatiquement). La signature est vérifiée quand le secret webhook est saisi, puis le paiement est toujours revérifié auprès du PSP avant tout crédit ;
- à défaut de clé en base, les Edge Functions utilisent les secrets d'environnement du même nom (ci-dessous).

## Offres et validation

- **Deux façons de valider** : le code QR personnel (scanné ou saisi par le partenaire) ou le **PIN de caisse** du partenaire, saisi sur le téléphone du membre (aucune connexion partenaire nécessaire en caisse). Le PIN est stocké haché ; 5 erreurs bloquent les essais 15 minutes.
- **Limites d'utilisation** par membre et par offre (par jour, semaine, mois, an ou au total), par exemple un « 1 acheté = 1 offert » une fois par an. La limite est vérifiée à la génération du code et au moment de la validation.
- **Favoris** et **avis vérifiés** : seuls les membres ayant réellement utilisé une offre peuvent la noter ; la note du partenaire est calculée à partir des avis (plus de note fictive). Les admins peuvent masquer un avis.

## Abonnements particuliers

- **Famille** : un plan peut inclure des proches (`family_seats`, réglable dans *Plans & tarifs* ; Premium 2, VIP 4 par défaut). Le titulaire les invite par email ; une fois l'invitation acceptée, ils profitent des offres avec leur propre compte tant que l'abonnement du titulaire est actif.
- **Cadeau** : tout membre peut offrir un abonnement particulier (1 mois ou 1 an), payé avec son wallet ou en ligne. Un code cadeau à usage unique est émis après paiement (valable 1 an, réservé au destinataire si un email est indiqué) ; il s'active depuis *Abonnement*.
- **Application installable** (PWA) : bouton « Installer l'app » dans les portails (Android, ordinateur ; consigne Partager → Écran d'accueil sur iPhone).

## Modèle monétaire

- Tous les soldes (wallet membre, wallet entreprise, solde partenaire) sont tenus en **USD** ;
- la table `currencies` (taux « pour 1 USD », éditable par l'admin) convertit les montants payés, retirés ou saisis en caisse ; la devise du wallet n'est qu'une préférence d'affichage ;
- les prix viennent d'une source unique : la table `plans` (éditable dans *Plans & tarifs*) ;
- remise et cashback sont calculés côté serveur (`redeem_code`) à partir du montant réel de l'addition ;
- les retraits membres et les paiements partenaires sont créés **en attente** puis traités par un admin (*Paiements & retraits*), avec remboursement automatique en cas de refus.

## Backend Supabase

### Base de données

Appliquer les migrations dans l'ordre :

```bash
supabase link --project-ref wdxgflyhjhcevdruvfjb
supabase db push
```

| Migration | Contenu |
| --- | --- |
| `20261006160000_archive_legacy_schema.sql` | Déplace l'ancien schéma `public` dans un schéma privé `legacy` (aucune suppression) |
| `20261006160100_app_schema.sql` | Schéma de base : entreprises, partenaires, profils, offres, redemptions, CMS… |
| `20261006170000_admins_profiles_settings.sql` | Super admins, paramètres plateforme, audit, parrainage |
| `20261006170100_money_plans_subscriptions.sql` | Devises, plans, abonnements, paiements, wallet, retraits, payouts |
| `20261006170200_psp_providers_vault.sql` | PSP + clés chiffrées dans Vault |
| `20261006170300_engagement_support_kyc_benefits.sql` | Avantages flexibles, reconnaissance, tickets support, KYC |
| `20261006170400_tenant_hardening_admin_stats.sql` | Durcissement multi-tenant, statistiques admin, 2FA admin |
| `20261006180000_mfa_enforcement_recovery.sql` | 2FA obligatoire (admins, RH) et codes de secours |
| `20261006180100_drop_legacy_source_snapshot.sql` | Supprime la copie de l'ancien code source laissée en base |
| `20261006190000_offer_limits_pin_favorites_reviews.sql` | Limites d'utilisation par offre, validation par PIN, favoris, avis vérifiés |
| `20261006200000_family_gift_memberships.sql` | Abonnement famille et abonnement offert (codes cadeaux) |

### Edge Functions

```bash
supabase functions deploy --no-verify-jwt
```

(`verify_jwt` est désactivé dans `supabase/config.toml` : chaque fonction vérifie elle-même l'utilisateur, ce qui permet aussi les clés `sb_publishable_…`.)

| Fonction | Rôle |
| --- | --- |
| `create-checkout` | Paiement PSP : recharge wallet, abonnement, recharge du budget entreprise |
| `verify-payment` | Confirmation auprès du PSP (référence, montant, devise) puis crédit idempotent |
| `payment-webhook` | Confirmation serveur à serveur envoyée par le PSP (même si le client ferme la page) |
| `mfa-recover` | Code de secours 2FA : retire l'authentificateur perdu |
| `redeem-with-pin` | Validation d'une offre sur le téléphone du membre avec le PIN de caisse du partenaire |
| `withdraw-wallet` | Demande de retrait (débit en attente de traitement admin) |
| `generate-redemption` / `validate-redemption` | Code QR membre et validation en caisse par le partenaire |
| `check-access` | Accès aux portails selon l'abonnement |
| `setup-account` | Onboarding (rôle, création de l'entreprise) |
| `validate-invite-code` / `consume-invite-code` | Invitations salariés (limite de sièges) |
| `submit-partner-application` | Candidature partenaire |
| `psp-test` | Test de connexion d'un PSP (admin) |
| `admin-invite-user` | Invitation email d'un futur admin (admin) |
| `nelvin-support` | Assistant IA (API Anthropic) |
| `list-pull-requests` | Page admin GitHub |

Secrets (`supabase secrets set NOM=valeur`) :

| Secret | Utilisé par |
| --- | --- |
| `APP_URL` | URL du site (redirections de paiement et invitations) |
| `ALLOWED_ORIGINS` | Optionnel : autres origines autorisées pour les retours de paiement |
| `STRIPE_SECRET_KEY`, `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`, `PADDLE_API_KEY`, `KORAPAY_SECRET_KEY`, `PAYUNIT_API_KEY`, `PAYUNIT_API_USERNAME`, `PAYUNIT_API_PASSWORD` | Repli si les clés ne sont pas saisies dans l'admin |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (optionnel) | Assistant IA |
| `GITHUB_TOKEN` | Page Pull requests |

### Auth (dashboard Supabase)

1. **Authentication → URL Configuration** : *Site URL* = l'URL du site ; ajouter `https://votre-domaine/**` (et `http://localhost:5173/**`) aux *Redirect URLs*.
2. **Authentication → Email Templates → Confirm signup** : l'app demande un **code à 6 chiffres**. Le modèle doit contenir `{{ .Token }}`, par exemple :
   `<p>Votre code Nelvin : <strong>{{ .Token }}</strong></p>`
3. **Authentication → Providers → Google** : activer et renseigner le client OAuth.
4. **Authentication → Multi-Factor** : laisser TOTP activé (2FA dans *Sécurité*).

### Storage

- `nelvin-public` : images publiques (≤ 10 Mo) ; les visiteurs ne peuvent téléverser que dans `applications/`.
- `kyc-private` : documents KYC des partenaires, privés, lisibles par le partenaire concerné et les admins via liens signés.

## Déploiement du frontend

Site statique (`npm run build` → `dist/`) déployable sur Vercel, Netlify, Cloudflare Pages…
Configurer la réécriture SPA (toutes les routes → `index.html`) et les variables `VITE_*`.

---

Développé par **[liafrik.com](https://liafrik.com)** pour Nelvin.
