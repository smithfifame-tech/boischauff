# BoisChauff+ — boutique en ligne de bois de chauffage

Site e-commerce complet : catalogue, calculateur de devis (kg / tonnes, tarifs dégressifs), panier persistant, commande, devis imprimable, paiement en ligne **SasPay** (MTN MoMo, Moov Money, Celtiis Cash…), e-mails automatiques, reçus PDF, suivi de commande, espace client et administration.

- **En ligne** : https://boischauff.vercel.app
- **Administration** : https://boischauff.vercel.app/admin

## Paiement SasPay (actif par défaut si les clés sont présentes)

Les commandes sont en euros ; SasPay n'acceptant pas l'euro, le montant est encaissé en **francs CFA (XOF)**
au taux fixe officiel **1 € = 655,957 F CFA**. Le client voit le montant converti avant de payer, et le serveur
vérifie que SasPay a bien encaissé exactement ce montant en XOF avant de marquer la commande payée.

Variables Vercel : `SASPAY_SECRET_KEY` (sk_live_…), `SASPAY_WEBHOOK_SECRET`, `SASPAY_ENVIRONMENT=live`.
Webhook à déclarer dans SasPay (événement `transaction.success`) : `https://VOTRE-DOMAINE/api/webhooks/saspay`.

## Paiement par carte — Stripe (recommandé pour la France et l'Europe)

1. Créez un compte sur https://dashboard.stripe.com et récupérez la **clé secrète** (`sk_test_…` puis `sk_live_…`).
2. Dans Stripe → Développeurs → Webhooks, ajoutez l'URL `https://VOTRE-DOMAINE/api/webhooks/stripe` avec les événements
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`,
   puis copiez le **secret de signature** (`whsec_…`).
3. Dans Vercel → Settings → Environment Variables : `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET`, puis redéployez.

Le mode démonstration se désactive automatiquement. Une commande n'est marquée payée qu'après relecture de la session
chez Stripe (statut `paid`, montant et devise identiques à la commande). SasPay (FCFA / Mobile Money) reste disponible dans le code.

## Pile technique

| Élément | Choix |
|---|---|
| Frontend + API | Next.js 15 (App Router, TypeScript), CSS sur mesure, responsive |
| Base de données | PostgreSQL (Supabase), schéma dédié `boischauff`, migrations SQL versionnées |
| Paiement | SasPay (sessions de paiement hébergées + webhook signé + vérification par l'API) |
| E-mails | SMTP (Nodemailer) ou Resend, journalisés dans `email_logs` |
| PDF | Reçus générés côté serveur (pdf-lib) |
| Hébergement | Vercel (région Paris `cdg1`) |

> Le cahier des charges citait PHP/MySQL. Pour un hébergement direct sur Vercel, l'application utilise Next.js + PostgreSQL. Elle respecte les mêmes exigences : requêtes paramétrées, validation serveur, CSRF, sessions sécurisées, mots de passe bcrypt, limitation des tentatives et montants recalculés par le serveur.

## Structure

```
db/migrations/        001_schema.sql (tables, clés, index) · 002_seed_demo.sql (données de démonstration)
scripts/              migrate.mjs (appliqué automatiquement au build) · create-admin.mjs
src/lib/              pricing (moteur de prix) · orders · payments (SasPay) · mailer · notifications · pdf · auth · security
src/app/(site)/       pages publiques (accueil, boutique, produit, devis, panier, commande, paiement, suivi, compte, pages légales)
src/app/admin/        tableau de bord, commandes, produits, livraison, e-mails, messages, paramètres
src/app/api/          API (devis, panier, commande, paiement, webhook, reçus, suivi, authentification, administration)
```

Tables : `users, admins, products, product_images, price_rules, carts, cart_items, orders, order_items, addresses, payments, payment_transactions, delivery_zones, delivery_tracking, receipts, email_logs, settings`, plus `login_attempts, password_resets, webhook_events, contact_messages`.

## Installation locale

```bash
npm install
cp .env.example .env.local   # renseigner DATABASE_URL et AUTH_SECRET
npm run db:migrate           # crée les tables et les données de démonstration
npm run admin:create -- admin@exemple.com   # affiche un mot de passe temporaire
npm run dev
```

## Déploiement (Vercel)

1. Variables d'environnement du projet Vercel : voir `.env.example` (`DATABASE_URL`, `AUTH_SECRET`, `SITE_URL`, `INITIAL_ADMIN_*`, `SASPAY_*`, `SMTP_*`).
2. Commande de build : `npm run vercel-build`. Elle applique les migrations, puis compile.
3. Au premier build, l'administrateur initial est créé à partir de `INITIAL_ADMIN_EMAIL` et `INITIAL_ADMIN_PASSWORD_HASH`. Le changement du mot de passe est imposé à la première connexion.

## Activer le paiement réel SasPay

1. **Devise** : SasPay n'accepte pas l'euro. Dans *Administration → Paramètres*, passez la devise en `XOF`, puis saisissez les prix réels en FCFA dans *Produits* et *Livraison*. Décochez ensuite « Prix de démonstration ».
2. Dans le tableau de bord SasPay (app.saspay.me), créez un webhook :
   - URL : `https://boischauff.vercel.app/api/webhooks/saspay`
   - événement : `transaction.success`
   - copiez le `signing_secret` immédiatement : il n'est affiché qu'une fois.
3. Dans Vercel → Settings → Environment Variables :

   | Variable | Test | Réel |
   |---|---|---|
   | `SASPAY_ENVIRONMENT` | `sandbox` | `live` |
   | `SASPAY_SECRET_KEY` | `sk_test_…` | `sk_live_…` |
   | `SASPAY_WEBHOOK_SECRET` | secret du webhook de test | secret du webhook réel |

4. Redéployez. *Administration → Paramètres* doit afficher « SasPay (test) », puis « SasPay (réel) ».

Garde-fous : une clé `sk_live_` n'est acceptée qu'en `live`, et une clé `sk_test_` qu'en `sandbox`. Tant que la clé et le secret sont absents, le site reste en **mode démonstration**, signalé sur toutes les pages, et aucun paiement n'est encaissé. Une commande n'est marquée payée qu'après confirmation par l'API SasPay du statut `SUCCESS`, du montant exact et de la devise.

## Activer les e-mails

Renseignez `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` et `MAIL_FROM`, ou `RESEND_API_KEY`. Pour Gmail : `smtp.gmail.com`, port 465, avec un mot de passe d'application. Les envois non partis restent visibles dans *Administration → E-mails* et peuvent être relancés.

## Tests réalisés

- 60 parcours automatisés : commandes de 50 € à plus de 1 000 €, quantités personnalisées, conversion kg / tonnes, livraison fixe, à la distance, offerte et sur devis, paiement réussi, refusé ou en attente, double paiement, reçu PDF, suivi, administration, limitation des tentatives.
- 10 tests SasPay contre une passerelle simulée : webhook signé ou non, rejoué, mensonger, montant falsifié, session expirée, page de retour.
- Parcours mobile complet dans un vrai navigateur, puis recette en production.
