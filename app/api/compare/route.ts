import { NextRequest } from "next/server";

import { compareSchema } from "@cia/types";
import { prisma } from "@cia/db";

import { withApiErrors, ok, parseSearchParams } from "@/lib/http";
import { resolveWorkspaceContext } from "@/lib/workspace";

export async function GET(request: NextRequest) {
  return withApiErrors(async () => {
    const params = parseSearchParams(new URL(request.url), compareSchema);
    const { workspace } = await resolveWorkspaceContext(request);

    if (params.type === "ads") {
      const [left, right] = await Promise.all([
        prisma.ad.findFirst({
          where: {
            id: params.leftId,
            advertiser: { competitors: { some: { workspaceId: workspace.id } } },
          },
          include: { analysis: true, advertiser: true, creatives: { take: 1 } },
        }),
        prisma.ad.findFirst({
          where: {
            id: params.rightId,
            advertiser: { competitors: { some: { workspaceId: workspace.id } } },
          },
          include: { analysis: true, advertiser: true, creatives: { take: 1 } },
        }),
      ]);

      return ok({ left, right });
    }

    if (params.type === "advertisers") {
      const [left, right] = await Promise.all([
        prisma.advertiser.findFirst({
          where: {
            id: params.leftId,
            competitors: { some: { workspaceId: workspace.id } },
          },
          include: {
            ads: { include: { analysis: true, creatives: { take: 1 } }, take: 30 },
          },
        }),
        prisma.advertiser.findFirst({
          where: {
            id: params.rightId,
            competitors: { some: { workspaceId: workspace.id } },
          },
          include: {
            ads: { include: { analysis: true, creatives: { take: 1 } }, take: 30 },
          },
        }),
      ]);

      return ok({ left, right });
    }

    const from = params.from ? new Date(params.from) : new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
    const to = params.to ? new Date(params.to) : new Date();
    const previousFrom = new Date(from);
    previousFrom.setDate(previousFrom.getDate() - (to.getDate() - from.getDate() || 30));

    const [current, previous] = await Promise.all([
      prisma.ad.findMany({
        where: {
          advertiser: { competitors: { some: { workspaceId: workspace.id } } },
          firstSeenAt: { gte: from, lte: to },
        },
        include: { analysis: true },
      }),
      prisma.ad.findMany({
        where: {
          advertiser: { competitors: { some: { workspaceId: workspace.id } } },
          firstSeenAt: { gte: previousFrom, lt: from },
        },
        include: { analysis: true },
      }),
    ]);

    return ok({
      current: {
        ads: current.length,
        hookTypes: current.map((x: any) => x.analysis?.hookType).filter(Boolean),
      },
      previous: {
        ads: previous.length,
        hookTypes: previous.map((x: any) => x.analysis?.hookType).filter(Boolean),
      },
    });
  });
}
