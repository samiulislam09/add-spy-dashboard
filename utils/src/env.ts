import { resolve } from "node:path";

import { config as loadEnv } from "dotenv";
import { z } from "zod";

const envCandidates = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "..", ".env"),
  resolve(process.cwd(), "..", "..", ".env"),
  resolve(process.cwd(), "..", "..", "..", ".env"),
];

for (const candidate of envCandidates) {
  loadEnv({ path: candidate, override: false, quiet: true });
}

const boolFromString = z
  .string()
  .optional()
  .transform((v) => v === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  ENABLE_AUTH: boolFromString.default(false),
  DEFAULT_WORKSPACE_SLUG: z.string().default("demo-store"),
  EMBED_SHARED_SECRET: z.string().min(12).default("change-me-in-production"),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("mysql://root:root@localhost:3306/competitor_ad_intelligence"),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().int().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: boolFromString.default(true),
  ADMIN_API_KEY: z.string().default("local-admin-key"),
  META_AD_LIBRARY_ACCESS_TOKEN: z.string().optional(),
  META_AD_LIBRARY_API_VERSION: z.string().default("v22.0"),
});

export const env = envSchema.parse(process.env);

export function isProd(): boolean {
  return env.NODE_ENV === "production";
}
