# Audit technique — Nelvin Perks Pass

Audit complet réalisé le 6 octobre 2026 · plateforme développée par [liafrik.com](https://liafrik.com).

## Résumé

L'application affichait de nombreux modules « de façade » : données fictives, actions sans effet, montants incohérents entre devises et contrôles d'accès faits uniquement dans l'interface. Chaque module repose désormais sur des données réelles, avec les règles métier appliquées en base (RLS + fonctions SQL atomiques) et vérifiées par 85 tests SQL automatisés.

## Failles corrigées (sécurité / multi-tenant)

| Problème | Correction |
| --- | --- |
| Un RH voyait les transactions personnelles (recharges, retraits) de ses salariés | Lecture RH limitée aux transactions d'entreprise (allocation, budget, abonnement, redemption) |
| Un RH pouvait modifier plan, statut, sièges ou solde de son entreprise | `guard_company_update` : champs réservés à Nelvin |
| Un partenaire pouvait se mettre « en avant » | `guard_offer_write` : mise en avant réservée aux admins |
| Les offres de partenaires non vérifiés étaient visibles | Lecture publique limitée aux partenaires vérifiés |
| Rôle super admin attribuable par simple mise à jour de profil | Liste `platform_admins` seule source ; minimum 2 ; pas d'auto-retrait ; audit |
| Clés PSP uniquement en variables d'environnement, aucune gestion admin | Saisie admin chiffrée dans Supabase Vault, lecture réservée au serveur |
| Admin sans exigence 2FA | 2FA obligatoire pour super admins et RH (session `aal2` exigée en base), codes de secours hachés, limite de 5 essais/heure |
| Paiement perdu si le client ferme la page | Webhooks PSP signés + revérification auprès du PSP, crédit idempotent |
| Copie de l'ancien code source stockée en base | Table supprimée (migration `drop_legacy_source_snapshot`) |
| Service worker cassé (« Failed to convert value to Response ») | Réécrit : n'intercepte plus les appels API, page hors-ligne propre |
| Logos partenaires via Clearbit (service fermé) | Remplacé par le service de favicons |
| Site construit sans variables Supabase → « Failed to fetch » | Projet de production par défaut (URL et clé publiques) |
| Documents KYC dans un bucket public | Bucket privé `kyc-private`, chemins préfixés par partenaire, liens signés |
| Vérification de paiement sans contrôle du montant | Vérification référence + montant + devise, crédit idempotent |
| Codes d'invitation générés avec `Math.random` | Générateur cryptographique (`crypto.getRandomValues`) |

## Fonctionnalités rendues réelles

- **Paiements** : checkout unique (recharge, abonnement, budget entreprise) avec routage selon les PSP réellement activés.
- **Retraits / paiements partenaires** : demandes en attente, traitement admin, remboursement automatique en cas de refus (auparavant : retrait « instantané » fictif).
- **Monnaie** : soldes tenus en USD, conversion par la table `currencies` (auparavant : montants XOF additionnés à des montants USD).
- **Redemption** : le partenaire saisit l'addition ; remise et cashback calculés côté serveur ; paiement wallet sur autorisation explicite du membre.
- **Abonnements** : plans en base (source unique des prix), abonnement par wallet, annulation, expiration réelle des entreprises.
- **Parrainage** : codes uniques, bonus versé au premier abonnement payé du filleul.
- **Récompenses, badges, reconnaissance** : calculés à partir de l'activité réelle ; reconnaissance limitée à l'entreprise, anti-spam.
- **RH** : avantages flexibles, distribution mensuelle des allocations, bonus individuels, départements, retrait d'employé, rapports.
- **Support** : tickets avec fil de messages temps réel et help desk admin.
- **Sécurité compte** : vrai changement de mot de passe, 2FA TOTP, déconnexion des autres sessions.
- **Back-office super admin** : statistiques réelles, clés PSP, paiements & retraits, plans & tarifs, devises, paramètres, super admins, journal d'audit, validation KYC avec documents et géolocalisation des partenaires.

## Données fictives supprimées

`src/data/mockData.js`, les devises codées en dur de l'admin, les badges et historiques simulés, l'essai gratuit B2C annoncé à tort, le résumé email non implémenté.

## Points restant à la charge de l'exploitant

1. Appliquer les migrations sur le projet Supabase et déployer les Edge Functions (voir README).
2. Saisir les clés PSP dans *Admin → Clés PSP & routage* puis passer chaque PSP en mode live.
3. Configurer le modèle d'email OTP (`{{ .Token }}`), les URL de redirection et Google OAuth.
4. Supprimer du projet Supabase les anciennes Edge Functions qui ne font plus partie du code (`invite-user`, `create-checkout-session`, `payment-webhook`).
5. Le schéma `legacy` conserve les anciennes tables (dont une copie de l'ancien code source) : à supprimer une fois les données vérifiées.
6. Les super admins sont invités à activer la 2FA dans *Sécurité*.

## Feuille de route (vs MyBenefit / The Entertainer)

**P1 — mécaniques The Entertainer** : validation par PIN partenaire (hors-ligne), limites d'utilisation par offre (BOGO / 2-pour-1 une fois par an), abonnement famille et cadeau, favoris et avis, PWA installable avec notifications push, arabe et anglais (RTL).

**P2 — mécaniques MyBenefit** : catalogue cafétéria (cartes cadeaux, sport, santé, voyage), import CSV des employés et SSO Google / Microsoft, export paie, portail aux couleurs de l'entreprise, facturation entreprise avec TVA EAU 5 %, emails transactionnels, conformité PDPL / RGPD (export et suppression du compte), supervision des erreurs et tests de bout en bout.
