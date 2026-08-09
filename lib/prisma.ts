import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const existingPrisma = globalForPrisma.prisma as
  | (PrismaClient & { _runtimeDataModel?: unknown })
  | undefined;

// Recreate the singleton after schema changes during Next.js hot reloads.
// A key-name diff only catches whole models appearing/disappearing (e.g.
// prisma.shareLink) — it misses a *field* added to a model that already
// existed (e.g. activeSeconds on ShareLinkVisit), which silently comes back
// undefined from the stale client instead of erroring. `_runtimeDataModel`
// is the client's full embedded schema (models, fields, types), so diffing
// it against a fresh client catches any schema change, not just new models.
const freshPrisma = new PrismaClient({ adapter }) as PrismaClient & { _runtimeDataModel?: unknown };
const isStale =
  !existingPrisma ||
  JSON.stringify(existingPrisma._runtimeDataModel) !== JSON.stringify(freshPrisma._runtimeDataModel);

export const prisma = isStale ? freshPrisma : existingPrisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
