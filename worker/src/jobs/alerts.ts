import { prisma } from "@cia/db";

export async function generateAlertEvents(jobData: { workspaceId?: string }) {
  const rules = await prisma.alertRule.findMany({
    where: {
      isActive: true,
      ...(jobData.workspaceId ? { workspaceId: jobData.workspaceId } : {}),
    },
  });

  const ads = await prisma.ad.findMany({
    where: {
      currentlyActive: true,
      ...(jobData.workspaceId
        ? {
            advertiser: {
              competitors: { some: { workspaceId: jobData.workspaceId } },
            },
          }
        : {}),
    },
    include: { analysis: true },
    take: 100,
  });

  let created = 0;
  for (const rule of rules) {
    for (const ad of ads) {
      const matches =
        (rule.type === "NEW_VIDEO" && ad.adFormat === "VIDEO") ||
        (rule.type === "NEW_CTA" && Boolean(ad.cta)) ||
        (rule.type === "NEW_OFFER" && Boolean(ad.analysis?.offerType)) ||
        (rule.type === "COPY_CHANGED" && ad.updatedAt > new Date(Date.now() - 1000 * 60 * 60 * 48)) ||
        rule.type === "NEW_AD_DETECTED";

      if (!matches) continue;

      await prisma.alertEvent.create({
        data: {
          alertRuleId: rule.id,
          adId: ad.id,
          eventType:
            rule.type === "NEW_AD_DETECTED"
              ? "NEW_AD"
              : rule.type === "NEW_CTA"
                ? "CTA_CHANGE"
                : "SNAPSHOT_CHANGE",
          payloadJson: {
            adId: ad.id,
            advertiserId: ad.advertiserId,
            ruleType: rule.type,
          },
          triggeredAt: new Date(),
        },
      });

      created += 1;
    }
  }

  return { created };
}
