# Seend — Web Application

Seend is a secure document-sharing platform. It allows organizations to upload
files, group them into data rooms, create controlled sharing links, and track
how recipients view them.

This directory contains the main application: the dashboard, administration
area, public viewer, and REST API.

## Features

- email and password authentication;
- organizations, members, roles, and invitations;
- PDF and image uploads to private storage;
- data rooms containing multiple documents;
- sharing links with expiration dates, authorized email lists, and revocation;
- optional collection of visitors' names and email addresses;
- custom watermarks on rendered pages;
- visit analytics and time spent per page;
- Stripe subscriptions and billing portal;
- API keys and REST API access for the Business plan;
- responsive light and dark themes.

## Tech Stack

- [Next.js](https://nextjs.org/) 16 and React 19;
- TypeScript and Tailwind CSS 4;
- PostgreSQL, Prisma 7, and the `pg` adapter;
- Better Auth for authentication and organizations;
- Vercel Blob for private file storage and the rendering cache;
- MuPDF for PDF rasterization;
- Resend for transactional emails;
- Stripe for subscriptions.

## Prerequisites

- [Bun](https://bun.sh/);
- an accessible PostgreSQL database;
- a private Vercel Blob store;
- a Resend account for invitations and password resets;
- a Stripe account if billing needs to be tested.

## Local Setup

From the `web` directory:

```bash
bun install
cp .env.example .env.local
```

In PowerShell, use the following command instead of the second command above:

```powershell
Copy-Item .env.example .env.local
```

Then configure the variables in `.env.local`, initialize the database, and
start the development server:

```bash
bun run db:push
bun run dev
```

The application is available at [http://localhost:3000](http://localhost:3000).
When the first user signs up, Seend creates both the user and their organization.

## Configuration

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL |
| `BETTER_AUTH_SECRET` | Random session secret containing at least 32 characters |
| `BETTER_AUTH_URL` | Public application URL, for example `http://localhost:3000` |
| `BLOB_READ_WRITE_TOKEN` | Token for the private Vercel Blob store |
| `BLOB_STORE_ID` | Vercel Blob store ID |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | Sender address for transactional emails |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_PRO_MONTHLY` | Price ID for the monthly Pro plan |
| `STRIPE_PRICE_PRO_YEARLY` | Price ID for the yearly Pro plan |
| `STRIPE_PRICE_BUSINESS_MONTHLY` | Price ID for the monthly Business plan |
| `STRIPE_PRICE_BUSINESS_YEARLY` | Price ID for the yearly Business plan |

Never commit `.env.local`. In production, `BETTER_AUTH_URL` must be the actual
HTTPS URL used by visitors, particularly because it is used to generate links
in emails and sharing links returned by the API.

### Stripe Webhook

The Stripe webhook must target:

```text
POST /api/webhooks/stripe
```

Its signing secret must be stored in `STRIPE_WEBHOOK_SECRET`. The four Price IDs
must match the prices configured in the same Stripe environment (test or
production).

## Useful Commands

| Command | Description |
| --- | --- |
| `bun run dev` | Starts the development server |
| `bun run build` | Creates a production build |
| `bun run start` | Starts the production build |
| `bun run lint` | Runs ESLint |
| `bun run typecheck` | Checks TypeScript types |
| `bun run format` | Formats TypeScript and TSX files |
| `bun run db:generate` | Regenerates the Prisma client |
| `bun run db:push` | Synchronizes the schema with the local database |
| `bun run db:migrate` | Creates and applies a Prisma migration |

After modifying `prisma/schema.prisma`, run at least `bun run db:generate`. For
changes intended to be shared or deployed, prefer a versioned migration over
`db:push`.

## REST API

The public API is available under `/api/v1` and uses a key created in
**Settings → API**:

```http
Authorization: Bearer seend_...
```

It can manage:

- `/api/v1/documents`;
- `/api/v1/datarooms` and their documents;
- `/api/v1/share-links`.

API keys and API access are restricted to the Business plan. To upload a
document, send the file as the raw request body, its MIME type in
`Content-Type`, and its name in `X-Filename`:

```bash
curl -X POST http://localhost:3000/api/v1/documents \
  -H "Authorization: Bearer seend_..." \
  -H "Content-Type: application/pdf" \
  -H "X-Filename: report.pdf" \
  --data-binary @report.pdf
```

Accepted formats are PDF, JPEG, PNG, WebP, and GIF. The maximum file size is
50 MiB.

## Architecture

```text
app/                  Next.js pages and HTTP routes
components/           Business interface and UI components
generated/prisma/     Generated Prisma client
lib/                  Authentication, data access, rendering, and external services
prisma/schema.prisma  PostgreSQL model
public/               Static assets
docs/                 Focused technical documentation
```

All business data belongs to an organization. Access checks must therefore
always verify `organizationId`, both in pages and API routes.

## Shared Document Security

Source files are kept in private storage. The public viewer never receives the
original blob: pages are rasterized as JPEGs on the server, then optionally
watermarked with the visitor's identity. The base rendering is cached, while
the watermark is generated on demand.

This property is important: routes intended for visitors must never return the
source file directly. The rendering process, cache, and limitations are
detailed in [`docs/document-rendering.md`](docs/document-rendering.md).

## Pre-release Checks

```bash
bun run lint
bun run typecheck
bun run build
```

The build requires the environment variables used by server-side integrations.
Also test the sign-up, invitation, upload, sharing, and payment flows against
the external services in the target environment.

## Deployment

The application is designed to be deployed on Vercel:

1. Create the PostgreSQL database and apply the migrations.
2. Create a private Vercel Blob store.
3. Configure all environment variables.
4. Set the domain in `BETTER_AUTH_URL`.
5. Configure the Stripe webhook to target `/api/webhooks/stripe`.
6. Deploy, then test emails and a shared document.

MuPDF is intentionally listed in `serverExternalPackages` in `next.config.ts`.
This configuration is required to load its WASM module in production.
