import { NextRequest } from "next/server";

import { collectionInputSchema } from "@cia/types";
import { listCollections, prisma } from "@cia/db";

import { withApiErrors, ok, parseBody } from "@/lib/http";
import { resolveWorkspaceContext } from "@/lib/workspace";

export async function GET(request: NextRequest) {
  return withApiErrors(async () => {
    const { workspace, user } = await resolveWorkspaceContext(request);
    const data = await listCollections(workspace.id, user.id);
    return ok(data);
  });
}

export async function POST(request: NextRequest) {
  return withApiErrors(async () => {
    const payload = await parseBody(request, collectionInputSchema);
    const { workspace, user } = await resolveWorkspaceContext(request);

    const collection = await prisma.collection.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        name: payload.name,
        description: payload.description,
      },
    });

    return ok(collection, { status: 201 });
  });
}
