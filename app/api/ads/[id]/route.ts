import { NextRequest } from "next/server";

import { getAdDetails, prisma } from "@cia/db";

import { withApiErrors, ok } from "@/lib/http";
import { resolveWorkspaceContext } from "@/lib/workspace";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withApiErrors(async () => {
    const { id } = await context.params;
    const { workspace } = await resolveWorkspaceContext(request);
    const ad = await getAdDetails(id, workspace.id);

    if (!ad) {
      return Response.json({ error: "Ad not found" }, { status: 404 });
    }

    const similarAds = await prisma.ad.findMany({
      where: {
        id: { not: ad.id },
        OR: [{ copyHash: ad.copyHash }, { creativeHash: ad.creativeHash }],
      },
      include: {
        advertiser: true,
        creatives: { take: 1 },
        analysis: true,
      },
      take: 6,
    });

    return ok({ ...ad, similarAds });
  });
}
