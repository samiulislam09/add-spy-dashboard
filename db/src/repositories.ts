import type { Prisma } from "@prisma/client";

import { prisma } from "./client";
import type { AdFilterInput } from "@cia/types";

function normalizeSearchTerm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function levenshteinDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, j) => j);

  for (let i = 1; i <= a.length; i++) {
    const current: number[] = [i];
    const aCode = a.charCodeAt(i - 1);

    for (let j = 1; j <= b.length; j++) {
      const cost = aCode === b.charCodeAt(j - 1) ? 0 : 1;
      const deletion = previous[j]! + 1;
      const insertion = current[j - 1]! + 1;
      const substitution = previous[j - 1]! + cost;
      current[j] = Math.min(deletion, insertion, substitution);
    }

    for (let j = 0; j <= b.length; j++) {
      previous[j] = current[j]!;
    }
  }

  return previous[b.length]!;
}

async function findFuzzyAdvertiserIds(workspaceId: string, query: string): Promise<string[]> {
  const normalizedQuery = normalizeSearchTerm(query);
  if (!normalizedQuery) return [];

  const advertisers = await prisma.advertiser.findMany({
    where: { competitors: { some: { workspaceId } } },
    select: { id: true, name: true, normalizedName: true },
    take: 2000,
  });

  const matches = advertisers.filter((advertiser) => {
    const normalizedName = normalizeSearchTerm(advertiser.normalizedName || advertiser.name);
    if (!normalizedName) return false;
    if (normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName)) return true;
    if (normalizedQuery.length < 4) return false;
    return levenshteinDistance(normalizedQuery, normalizedName) <= 2;
  });

  return matches.slice(0, 60).map((item) => item.id);
}

export async function resolveWorkspaceBySlug(slug: string) {
  return prisma.workspace.findUnique({ where: { slug } });
}

export async function listAdvertisers(workspaceId: string, q?: string) {
  const include = {
    _count: { select: { ads: true } },
    ads: {
      orderBy: { lastSeenAt: "desc" as const },
      take: 4,
      include: { analysis: true, creatives: { take: 1 } },
    },
  };

  const query = q?.trim();

  if (!query) {
    return prisma.advertiser.findMany({
      where: {
        competitors: { some: { workspaceId } },
      },
      include,
      orderBy: { updatedAt: "desc" },
    });
  }

  const strictItems = await prisma.advertiser.findMany({
    where: {
      competitors: { some: { workspaceId } },
      OR: [{ name: { contains: query } }, { normalizedName: { contains: query.toLowerCase() } }],
    },
    include,
    orderBy: { updatedAt: "desc" },
  });

  if (strictItems.length > 0) {
    return strictItems;
  }

  const fuzzyIds = await findFuzzyAdvertiserIds(workspaceId, query);
  if (fuzzyIds.length === 0) {
    return [];
  }

  const fuzzyItems = await prisma.advertiser.findMany({
    where: {
      competitors: { some: { workspaceId } },
      id: { in: fuzzyIds },
    },
    include,
  });

  const order = new Map(fuzzyIds.map((id, index) => [id, index]));
  return fuzzyItems.sort((a, b) => (order.get(a.id) ?? 9999) - (order.get(b.id) ?? 9999));
}

export async function getAdvertiserDetails(advertiserId: string, workspaceId: string) {
  return prisma.advertiser.findFirst({
    where: {
      id: advertiserId,
      competitors: { some: { workspaceId } },
    },
    include: {
      ads: {
        orderBy: { lastSeenAt: "desc" },
        include: {
          creatives: true,
          analysis: true,
        },
        take: 30,
      },
    },
  });
}

function adOrderBy(sortBy: AdFilterInput["sortBy"]): Prisma.AdOrderByWithRelationInput[] {
  switch (sortBy) {
    case "FIRST_SEEN_DESC":
      return [{ firstSeenAt: "desc" }];
    case "LONGEST_RUNNING":
      return [{ firstSeenAt: "asc" }];
    case "MOST_RECENTLY_CHANGED":
      return [{ updatedAt: "desc" }];
    case "LAST_SEEN_DESC":
    default:
      return [{ lastSeenAt: "desc" }];
  }
}

export async function listAds(workspaceId: string, input: AdFilterInput) {
  const query = input.q?.trim();
  const fuzzyAdvertiserIds = query ? await findFuzzyAdvertiserIds(workspaceId, query) : [];

  const searchOr: Prisma.AdWhereInput[] = [];
  if (query) {
    searchOr.push(
      { primaryText: { contains: query } },
      { headline: { contains: query } },
      { description: { contains: query } },
      { advertiser: { name: { contains: query } } },
    );
  }
  if (fuzzyAdvertiserIds.length > 0) {
    searchOr.push({ advertiserId: { in: fuzzyAdvertiserIds } });
  }

  const where: Prisma.AdWhereInput = {
    advertiser: {
      competitors: { some: { workspaceId } },
    },
    ...(searchOr.length > 0 ? { OR: searchOr } : {}),
    ...(input.advertiserId ? { advertiserId: input.advertiserId } : {}),
    ...(input.platform ? { platform: input.platform } : {}),
    ...(input.language ? { language: input.language } : {}),
    ...(input.adFormat ? { adFormat: input.adFormat } : {}),
    ...(input.activeOnly ? { currentlyActive: true } : {}),
    ...(input.firstSeenFrom || input.firstSeenTo
      ? {
          firstSeenAt: {
            ...(input.firstSeenFrom ? { gte: new Date(input.firstSeenFrom) } : {}),
            ...(input.firstSeenTo ? { lte: new Date(input.firstSeenTo) } : {}),
          },
        }
      : {}),
    ...(input.lastSeenFrom || input.lastSeenTo
      ? {
          lastSeenAt: {
            ...(input.lastSeenFrom ? { gte: new Date(input.lastSeenFrom) } : {}),
            ...(input.lastSeenTo ? { lte: new Date(input.lastSeenTo) } : {}),
          },
        }
      : {}),
    ...(input.hasVideo
      ? {
          creatives: {
            some: { mediaType: "video" },
          },
        }
      : {}),
    ...(input.ctaType || input.offerType || input.tone || input.hookType || input.messagingAngle
      ? {
          analysis: {
            ...(input.ctaType ? { ctaType: input.ctaType } : {}),
            ...(input.offerType ? { offerType: input.offerType } : {}),
            ...(input.tone ? { tone: input.tone } : {}),
            ...(input.hookType ? { hookType: input.hookType } : {}),
            ...(input.messagingAngle ? { angle: { contains: input.messagingAngle } } : {}),
          },
        }
      : {}),
    ...(input.country ? {} : {}),
  };

  const [items, total] = await Promise.all([
    prisma.ad.findMany({
      where,
      include: {
        advertiser: true,
        creatives: { take: 2 },
        analysis: true,
        snapshots: {
          orderBy: { snapshotAt: "desc" },
          take: 2,
        },
      },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      orderBy: adOrderBy(input.sortBy),
    }),
    prisma.ad.count({ where }),
  ]);

  return {
    items,
    total,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.ceil(total / input.pageSize),
  };
}

export async function getAdDetails(adId: string, workspaceId: string) {
  return prisma.ad.findFirst({
    where: {
      id: adId,
      advertiser: {
        competitors: { some: { workspaceId } },
      },
    },
    include: {
      advertiser: true,
      creatives: true,
      snapshots: { orderBy: { snapshotAt: "desc" }, take: 30 },
      analysis: true,
      landingPages: true,
    },
  });
}

export async function listCollections(workspaceId: string, userId: string) {
  return prisma.collection.findMany({
    where: { workspaceId, userId },
    include: {
      items: {
        include: {
          ad: {
            include: {
              advertiser: true,
              creatives: { take: 1 },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}
