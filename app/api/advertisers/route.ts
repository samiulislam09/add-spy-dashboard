import { NextRequest } from "next/server";

import { z } from "zod";

import { listAdvertisers } from "@cia/db";

import { withApiErrors, ok, parseSearchParams } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveWorkspaceContext } from "@/lib/workspace";

const querySchema = z.object({
  q: z.string().optional(),
});

export async function GET(request: NextRequest) {
  return withApiErrors(async () => {
    const ip = request.headers.get("x-forwarded-for") || "local";
    const rl = checkRateLimit(`advertisers:${ip}`, 240, 60_000);
    if (!rl.allowed) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }

    const query = parseSearchParams(new URL(request.url), querySchema);
    const { workspace } = await resolveWorkspaceContext(request);
    const items = await listAdvertisers(workspace.id, query.q);

    return ok(items);
  });
}
