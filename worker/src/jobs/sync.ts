import { prisma } from "@cia/db";
import { runIngestionForSource } from "@cia/ingestion";

export async function runSyncAdvertiserAds(jobData: { sourceId?: string; workspaceId?: string }) {
  const source = jobData.sourceId
    ? await prisma.ingestionSource.findUnique({ where: { id: jobData.sourceId } })
    : await prisma.ingestionSource.findFirst({ where: { isEnabled: true }, orderBy: { createdAt: "desc" } });

  if (!source) {
    return {
      status: "SKIPPED",
      reason: "No enabled ingestion source found",
    };
  }

  return runIngestionForSource({
    workspaceId: jobData.workspaceId || source.workspaceId,
    sourceType: source.type,
    sourceId: source.id,
  });
}
