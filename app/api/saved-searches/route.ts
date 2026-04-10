import { NextRequest } from "next/server";

import { savedSearchInputSchema } from "@cia/types";
import { prisma } from "@cia/db";

import { withApiErrors, ok, parseBody } from "@/lib/http";
import { resolveWorkspaceContext } from "@/lib/workspace";

export async function GET(request: NextRequest) {
  return withApiErrors(async () => {
    const { workspace, user } = await resolveWorkspaceContext(request);

    const items = await prisma.savedSearch.findMany({
      where: {
        workspaceId: workspace.id,
        userId: user.id,
      },
      orderBy: { updatedAt: "desc" },
    });

    return ok(items);
  });
}

export async function POST(request: NextRequest) {
  return withApiErrors(async () => {
    const payload = await parseBody(request, savedSearchInputSchema);
    const { workspace, user } = await resolveWorkspaceContext(request);

    const item = await prisma.savedSearch.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        name: payload.name,
        filtersJson: payload.filtersJson as any,
      },
    });

    return ok(item, { status: 201 });
  });
}
