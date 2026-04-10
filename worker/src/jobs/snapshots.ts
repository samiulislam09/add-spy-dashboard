import { prisma } from "@cia/db";

export async function refreshAdSnapshots(jobData: { workspaceId?: string }) {
  const ads = await prisma.ad.findMany({
    where: jobData.workspaceId
      ? {
          advertiser: {
            competitors: {
              some: { workspaceId: jobData.workspaceId },
            },
          },
        }
      : {},
    include: {
      snapshots: { orderBy: { snapshotAt: "desc" }, take: 1 },
    },
    take: 200,
  });

  let created = 0;
  for (const ad of ads) {
    const latest = ad.snapshots[0];
    const summary = latest
      ? "Periodic snapshot refresh"
      : "First snapshot created by worker";

    await prisma.adSnapshot.create({
      data: {
        adId: ad.id,
        snapshotAt: new Date(),
        primaryText: ad.primaryText,
        headline: ad.headline,
        description: ad.description,
        cta: ad.cta,
        destinationUrl: ad.destinationUrl,
        rawPayloadJson: ad.rawPayloadJson as any,
        changeSummary: summary,
      },
    });
    created += 1;
  }

  return { created };
}
