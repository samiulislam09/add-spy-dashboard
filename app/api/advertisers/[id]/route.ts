import { NextRequest } from "next/server";

import { getAdvertiserDetails } from "@cia/db";

import { withApiErrors, ok } from "@/lib/http";
import { resolveWorkspaceContext } from "@/lib/workspace";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return withApiErrors(async () => {
    const { id } = await context.params;
    const { workspace } = await resolveWorkspaceContext(request);
    const item = await getAdvertiserDetails(id, workspace.id);

    if (!item) {
      return Response.json({ error: "Advertiser not found" }, { status: 404 });
    }

    return ok(item);
  });
}
