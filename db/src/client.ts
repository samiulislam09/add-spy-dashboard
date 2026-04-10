import { resolve } from "node:path";

import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";

const envCandidates = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "..", ".env"),
  resolve(process.cwd(), "..", "..", ".env"),
  resolve(process.cwd(), "..", "..", "..", ".env"),
];

for (const candidate of envCandidates) {
  loadEnv({ path: candidate, override: false, quiet: true });
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Define it in .env at the workspace root before starting the app.",
  );
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
