import { analyzeMessaging } from "@cia/ai";
import { prisma } from "@cia/db";

export async function computeMessagingAnalysis(jobData: { workspaceId?: string }) {
  const ads = await prisma.ad.findMany({
    where: {
      ...(jobData.workspaceId
        ? {
            advertiser: {
              competitors: { some: { workspaceId: jobData.workspaceId } },
            },
          }
        : {}),
    },
    include: { analysis: true },
    take: 300,
  });

  let updated = 0;
  for (const ad of ads) {
    const analysis = await analyzeMessaging({
      primaryText: ad.primaryText,
      headline: ad.headline,
      description: ad.description,
      cta: ad.cta,
    });

    await prisma.messagingAnalysis.upsert({
      where: { adId: ad.id },
      update: {
        hook: analysis.hook,
        hookType: analysis.hookType,
        angle: analysis.angle,
        tone: analysis.tone,
        audienceIntent: analysis.audienceIntent,
        offerType: analysis.offerType,
        urgencySignals: analysis.urgencySignals,
        socialProofSignals: analysis.socialProofSignals,
        ctaType: analysis.ctaType,
        painPoints: analysis.painPoints,
        benefits: analysis.benefits,
        emotionalTriggers: analysis.emotionalTriggers,
        summary: analysis.summary,
        keywords: analysis.keywords,
        confidenceScoresJson: analysis.confidenceScoresJson,
      },
      create: {
        adId: ad.id,
        hook: analysis.hook,
        hookType: analysis.hookType,
        angle: analysis.angle,
        tone: analysis.tone,
        audienceIntent: analysis.audienceIntent,
        offerType: analysis.offerType,
        urgencySignals: analysis.urgencySignals,
        socialProofSignals: analysis.socialProofSignals,
        ctaType: analysis.ctaType,
        painPoints: analysis.painPoints,
        benefits: analysis.benefits,
        emotionalTriggers: analysis.emotionalTriggers,
        summary: analysis.summary,
        keywords: analysis.keywords,
        confidenceScoresJson: analysis.confidenceScoresJson,
      },
    });

    updated += 1;
  }

  return { updated };
}
