# Seend — application web

Seend est une plateforme de partage sécurisé de documents. Elle permet à une
organisation d'importer des fichiers, de les regrouper dans des datarooms, de
créer des liens de partage contrôlés et de suivre leur consultation.

Ce dossier contient l'application principale : le tableau de bord, l'espace
d'administration, le lecteur public et l'API REST.

## Fonctionnalités

- authentification par email et mot de passe ;
- organisations, membres, rôles et invitations ;
- import de PDF et d'images dans un stockage privé ;
- datarooms regroupant plusieurs documents ;
- liens de partage avec expiration, liste d'emails autorisés et révocation ;
- collecte facultative du nom et de l'email du visiteur ;
- filigrane personnalisé dans les pages rendues ;
- statistiques de visites et de temps passé par page ;
- abonnements et portail de facturation Stripe ;
- clés d'API et API REST pour le plan Business ;
- interface claire/sombre et responsive.

## Stack technique

- [Next.js](https://nextjs.org/) 16 et React 19 ;
- TypeScript et Tailwind CSS 4 ;
- PostgreSQL, Prisma 7 et l'adaptateur `pg` ;
- Better Auth pour l'authentification et les organisations ;
- Vercel Blob pour les fichiers privés et le cache de rendu ;
- MuPDF pour la rasterisation des PDF ;
- Resend pour les emails transactionnels ;
- Stripe pour les abonnements.

## Prérequis

- [Bun](https://bun.sh/) ;
- une base PostgreSQL accessible ;
- un store privé Vercel Blob ;
- un compte Resend pour les invitations et réinitialisations de mot de passe ;
- un compte Stripe si la facturation doit être testée.

## Installation locale

Depuis le dossier `web` :

```bash
bun install
cp .env.example .env.local
```

Sous PowerShell, la deuxième commande devient :

```powershell
Copy-Item .env.example .env.local
```

Renseigner ensuite les variables de `.env.local`, initialiser la base et lancer
le serveur de développement :

```bash
bun run db:push
bun run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).
Lors de la première inscription, Seend crée l'utilisateur et son organisation.

## Configuration

| Variable | Usage |
| --- | --- |
| `DATABASE_URL` | URL de connexion PostgreSQL |
| `BETTER_AUTH_SECRET` | Secret de session aléatoire d'au moins 32 caractères |
| `BETTER_AUTH_URL` | URL publique de l'application, par exemple `http://localhost:3000` |
| `BLOB_READ_WRITE_TOKEN` | Jeton du store privé Vercel Blob |
| `BLOB_STORE_ID` | Identifiant du store Vercel Blob |
| `RESEND_API_KEY` | Clé API Resend |
| `EMAIL_FROM` | Expéditeur des emails transactionnels |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret de signature du webhook Stripe |
| `STRIPE_PRICE_PRO_MONTHLY` | Price ID de l'offre Pro mensuelle |
| `STRIPE_PRICE_PRO_YEARLY` | Price ID de l'offre Pro annuelle |
| `STRIPE_PRICE_BUSINESS_MONTHLY` | Price ID de l'offre Business mensuelle |
| `STRIPE_PRICE_BUSINESS_YEARLY` | Price ID de l'offre Business annuelle |

Ne jamais versionner `.env.local`. En production, `BETTER_AUTH_URL` doit être
l'URL HTTPS réellement utilisée par les visiteurs, notamment pour générer les
liens contenus dans les emails et les liens de partage renvoyés par l'API.

### Webhook Stripe

Le webhook Stripe doit cibler :

```text
POST /api/webhooks/stripe
```

Son secret de signature doit être enregistré dans `STRIPE_WEBHOOK_SECRET`. Les
quatre Price IDs doivent correspondre aux prix configurés dans le même
environnement Stripe (test ou production).

## Commandes utiles

| Commande | Description |
| --- | --- |
| `bun run dev` | Démarre le serveur de développement |
| `bun run build` | Produit le build de production |
| `bun run start` | Démarre le build de production |
| `bun run lint` | Lance ESLint |
| `bun run typecheck` | Vérifie les types TypeScript |
| `bun run format` | Formate les fichiers TypeScript et TSX |
| `bun run db:generate` | Régénère le client Prisma |
| `bun run db:push` | Synchronise le schéma avec la base locale |
| `bun run db:migrate` | Crée et applique une migration Prisma |

Après une modification de `prisma/schema.prisma`, exécuter au minimum
`bun run db:generate`. Pour une évolution destinée à être partagée ou déployée,
préférer une migration versionnée à `db:push`.

## API REST

L'API publique est exposée sous `/api/v1` et utilise une clé créée dans
**Paramètres → API** :

```http
Authorization: Bearer seend_...
```

Elle permet de gérer :

- `/api/v1/documents` ;
- `/api/v1/datarooms` et leurs documents ;
- `/api/v1/share-links`.

L'accès aux clés et à l'API est réservé au plan Business. Lors de l'import d'un
document, le fichier est envoyé comme corps brut avec son type MIME dans
`Content-Type` et son nom dans `X-Filename` :

```bash
curl -X POST http://localhost:3000/api/v1/documents \
  -H "Authorization: Bearer seend_..." \
  -H "Content-Type: application/pdf" \
  -H "X-Filename: rapport.pdf" \
  --data-binary @rapport.pdf
```

Les formats acceptés sont PDF, JPEG, PNG, WebP et GIF. La taille maximale est
de 50 Mio par fichier.

## Architecture

```text
app/                  Pages Next.js et routes HTTP
components/           Interface métier et composants UI
generated/prisma/     Client Prisma généré
lib/                  Auth, accès aux données, rendu et services externes
prisma/schema.prisma  Modèle PostgreSQL
public/               Ressources statiques
docs/                 Documentation technique ciblée
```

Toutes les données métier sont rattachées à une organisation. Les contrôles
d'accès doivent donc toujours vérifier `organizationId`, aussi bien dans les
pages que dans les routes API.

## Sécurité des documents partagés

Les fichiers sources sont conservés dans un store privé. Le lecteur public ne
reçoit jamais le blob original : les pages sont rasterisées en JPEG côté
serveur, puis éventuellement marquées avec l'identité du visiteur. Le rendu de
base est mis en cache, tandis que le filigrane reste généré à la demande.

Cette propriété est importante : aucune route destinée aux visiteurs ne doit
renvoyer directement le fichier source. Le fonctionnement, le cache et les
limites du rendu sont détaillés dans
[`docs/document-rendering.md`](docs/document-rendering.md).

## Vérifications avant livraison

```bash
bun run lint
bun run typecheck
bun run build
```

Le build a besoin des variables d'environnement utilisées par les intégrations
serveur. Vérifier également les parcours d'inscription, d'invitation, d'import,
de partage et de paiement avec les services externes de l'environnement visé.

## Déploiement

L'application est conçue pour être déployée sur Vercel :

1. créer la base PostgreSQL et appliquer les migrations ;
2. créer un store Vercel Blob privé ;
3. renseigner toutes les variables d'environnement ;
4. configurer le domaine dans `BETTER_AUTH_URL` ;
5. déclarer le webhook Stripe vers `/api/webhooks/stripe` ;
6. déployer puis tester les emails et un document partagé.

MuPDF est volontairement déclaré dans `serverExternalPackages` dans
`next.config.ts`. Cette configuration est nécessaire au chargement de son
module WASM en production.
