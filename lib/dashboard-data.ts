import { buildDailyNewAdsSeries, computeDashboardKpis, distributionBy } from "@cia/analytics";
import { prisma } from "@cia/db";

export async function getDashboardData(workspaceId: string) {
  const [advertisers, adsRaw] = await Promise.all([
    prisma.advertiser.count({
      where: {
        competitors: { some: { workspaceId } },
      },
    }),
    prisma.ad.findMany({
      where: {
        advertiser: {
          competitors: { some: { workspaceId } },
        },
      },
      include: { analysis: true },
      orderBy: { firstSeenAt: "desc" },
      take: 400,
    }),
  ]);

  const ads = adsRaw as Array<any>;

  return {
    kpis: computeDashboardKpis(ads, advertisers),
    series: {
      newAdsOverTime: buildDailyNewAdsSeries(ads),
      platformMix: Object.entries(distributionBy(ads.map((a) => ({ key: a.platform })))).map(
        ([name, value]) => ({ name, value }),
      ),
      ctaDistribution: Object.entries(distributionBy(ads.map((a) => ({ key: a.cta })))).map(
        ([name, value]) => ({ name, value }),
      ),
      formatDistribution: Object.entries(distributionBy(ads.map((a) => ({ key: a.adFormat })))).map(
        ([name, value]) => ({ name, value }),
      ),
      hookTypeDistribution: Object.entries(
        distributionBy(ads.map((a) => ({ key: a.analysis?.hookType || "Unknown" })),),
      ).map(([name, value]) => ({ name, value })),
    },
  };
}
