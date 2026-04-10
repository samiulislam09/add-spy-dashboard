import { NextRequest } from "next/server";

import { alertRuleInputSchema } from "@cia/types";
import { prisma } from "@cia/db";

import { withApiErrors, ok, parseBody } from "@/lib/http";
import { resolveWorkspaceContext } from "@/lib/workspace";

export async function GET(request: NextRequest) {
  return withApiErrors(async () => {
    const { workspace, user } = await resolveWorkspaceContext(request);

    const [rules, events] = await Promise.all([
      prisma.alertRule.findMany({
        where: {
          workspaceId: workspace.id,
          userId: user.id,
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.alertEvent.findMany({
        where: {
          alertRule: {
            workspaceId: workspace.id,
            userId: user.id,
          },
        },
        include: {
          ad: {
            include: {
              advertiser: true,
            },
          },
          alertRule: true,
        },
        orderBy: { triggeredAt: "desc" },
        take: 60,
      }),
    ]);

    return ok({ rules, events });
  });
}

export async function POST(request: NextRequest) {
  return withApiErrors(async () => {
    const payload = await parseBody(request, alertRuleInputSchema);
    const { workspace, user } = await resolveWorkspaceContext(request);

    const item = await prisma.alertRule.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        name: payload.name,
        type: payload.type,
        conditionsJson: payload.conditionsJson as any,
        isActive: payload.isActive,
      },
    });

    return ok(item, { status: 201 });
  });
}
