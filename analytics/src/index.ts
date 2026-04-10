import { subDays } from "date-fns";

type MinimalAd = {
  platform: string;
  adFormat: string;
  cta: string | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  currentlyActive: boolean;
  analysis?: {
    hookType?: string | null;
    angle?: string | null;
  } | null;
};

export function computeDashboardKpis(ads: MinimalAd[], advertisersCount: number) {
  const sevenDaysAgo = subDays(new Date(), 7);

  return {
    trackedAdvertisers: advertisersCount,
    activeAds: ads.filter((ad) => ad.currentlyActive).length,
    newAds7d: ads.filter((ad) => ad.firstSeenAt >= sevenDaysAgo).length,
    messagingShiftSignals: ads.filter(
      (ad) => ad.analysis?.hookType === "FOMO" || ad.analysis?.angle?.toLowerCase().includes("offer"),
    ).length,
  };
}

export function distributionBy<T extends string>(items: Array<{ key: T | null }>) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = item.key || "Unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

export function buildDailyNewAdsSeries(ads: MinimalAd[]): Array<{ date: string; value: number }> {
  const map = new Map<string, number>();

  for (const ad of ads) {
    const date = ad.firstSeenAt.toISOString().slice(0, 10);
    map.set(date, (map.get(date) ?? 0) + 1);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}
