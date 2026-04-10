import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@cia/ai",
    "@cia/analytics",
    "@cia/db",
    "@cia/ingestion",
    "@cia/types",
    "@cia/ui",
    "@cia/utils",
  ],
};

export default nextConfig;
