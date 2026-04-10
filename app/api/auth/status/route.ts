import { env } from "@cia/utils";

import { withApiErrors, ok } from "@/lib/http";

export async function GET() {
  return withApiErrors(async () => {
    return ok({
      enabled: env.ENABLE_AUTH,
      mode: env.ENABLE_AUTH ? "auth-required" : "embedded-no-auth",
      notes:
        "Authentication is disabled by default for embedded deployments. Workspace context is resolved through x-store-id/storeId.",
    });
  });
}
