import { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@cia/db";

import { withApiErrors, ok, parseBody } from "@/lib/http";
import { enqueueSyncJobs } from "@/lib/queues";
import { assertAdmin } from "@/lib/security";
import { resolveWorkspaceContext } from "@/lib/workspace";

const schema = z.object({
  sourceId: z.string().optional(),
  reason: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  return withApiErrors(async () => {
    assertAdmin(request);
    const payload = await parseBody(request, schema);
    const { workspace, user } = await resolveWorkspaceContext(request);

    await enqueueSyncJobs({ sourceId: payload.sourceId, workspaceId: workspace.id });

    await prisma.auditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: "BACKFILL_TRIGGERED",
        entityType: "IngestionSource",
        entityId: payload.sourceId,
        payloadJson: payload,
      },
    });

    return ok({ queued: true });
  });
}
