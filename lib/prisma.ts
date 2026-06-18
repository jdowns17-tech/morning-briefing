import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

declare global {
  var prismaClient: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL env var. Set it in .env.local (see .env.example).");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  if (!globalThis.prismaClient) {
    globalThis.prismaClient = createPrismaClient();
  }
  return globalThis.prismaClient;
}

// Lazily constructed on first real use (not at module import time) so the
// connection string is only required once a request actually touches the DB —
// builds and module introspection can load this file without one configured.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrismaClient(), prop, receiver);
  },
});
