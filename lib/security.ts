import { NextRequest } from "next/server";

import { env } from "@cia/utils";

export function assertAdmin(request: NextRequest) {
  const key = request.headers.get("x-admin-key");
  if (!key || key !== env.ADMIN_API_KEY) {
    throw new Error("Forbidden: missing or invalid x-admin-key");
  }
}
