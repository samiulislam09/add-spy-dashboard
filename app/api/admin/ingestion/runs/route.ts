import { NextRequest } from "next/server";

import { prisma } from "@cia/db";

import { withApiErrors, ok } from "@/lib/http";
import { assertAdmin } from "@/lib/security";
import { resolveWorkspaceContext } from "@/lib/workspace";

export async function GET(request: NextRequest) {
  return withApiErrors(async () => {
    assertAdmin(request);
    const { workspace } = await resolveWorkspaceContext(request);

    const [sources, runs] = await Promise.all([
      prisma.ingestionSource.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.ingestionRun.findMany({
        where: {
          ingestionSource: {
            workspaceId: workspace.id,
          },
        },
        include: {
          ingestionSource: true,
        },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
    ]);

    return ok({ sources, runs });
  });
}
