import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "worker/dist/**",
    "ai/dist/**",
    "analytics/dist/**",
    "db/dist/**",
    "ingestion/dist/**",
    "types/dist/**",
    "ui/dist/**",
    "utils/dist/**",
    "next-env.d.ts",
  ]),
]);
