import { analyzeMessaging } from "@cia/ai";
import { prisma } from "@cia/db/client";
import { sha256 } from "@cia/utils/hash";

import type { ConnectorContext, IngestionConnector, NormalizedAdRecord } from "../types";
import { MetaPublicConnector } from "../connectors/meta-public";

type IngestionRunStatus = "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED";
type IngestionSourceType =
  | "META_PUBLIC"
  | "TIKTOK_PUBLIC"
  | "GOOGLE_TRANSPARENCY"
  | "CSV"
  | "JSON"
  | "MOCK";

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function configString(config: Record<string, unknown>, key: string): string | undefined {
  const value = config[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function configStringArray(config: Record<string, unknown>, key: string): string[] {
  const value = config[key];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function configNumber(config: Record<string, unknown>, key: string): number | undefined {
  const value = config[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export class IngestionPipelineService {
  constructor(private readonly connector: IngestionConnector) {}

  async run(params: { workspaceId: string; sourceId: string }) {
    const run = await prisma.ingestionRun.create({
      data: {
        ingestionSourceId: params.sourceId,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    const errors: Array<{ row?: string; message: string }> = [];
    let recordsIn = 0;
    let recordsOut = 0;

    try {
      const ctx: ConnectorContext = {
        workspaceId: params.workspaceId,
        sourceId: params.sourceId,
      };

      const rawAds = await this.connector.fetchAds(ctx);
      recordsIn = rawAds.length;

      for (const raw of rawAds) {
        try {
          const normalized = await this.connector.normalizeRecord(raw);
          if (!normalized) {
            continue;
          }
          await this.upsertEntities(params.workspaceId, normalized);
          recordsOut += 1;
        } catch (error) {
          errors.push({
            row: String(raw.adExternalId || "unknown"),
            message: error instanceof Error ? error.message : "Unknown normalization failure",
          });
        }
      }

      await this.completeRun(run.id, {
        status: errors.length > 0 ? "FAILED" : "SUCCESS",
        recordsIn,
        recordsOut,
        errors,
      });

      return {
        runId: run.id,
        status: errors.length > 0 ? "FAILED" : "SUCCESS",
        recordsIn,
        recordsOut,
        errors,
      };
    } catch (error) {
      await this.completeRun(run.id, {
        status: "FAILED",
        recordsIn,
        recordsOut,
        errors: [
          ...errors,
          {
            message: error instanceof Error ? error.message : "Unexpected ingestion error",
          },
        ],
      });

      throw error;
    }
  }

  private async upsertEntities(workspaceId: string, row: NormalizedAdRecord) {
    const advertiser = await prisma.advertiser.upsert({
      where: {
        platform_externalAdvertiserId: {
          platform: row.platform,
          externalAdvertiserId: row.advertiserExternalId,
        },
      },
      update: {
        name: row.advertiserName,
        normalizedName: row.advertiserName.toLowerCase().replace(/\s+/g, "-"),
        profileUrl: row.advertiserProfileUrl,
        website: row.advertiserWebsite,
        countries: row.advertiserCountries,
        metadataJson: {
          complianceBoundary: "public-or-authorized-only",
          sourceType: row.sourceType,
        },
      },
      create: {
        platform: row.platform,
        externalAdvertiserId: row.advertiserExternalId,
        name: row.advertiserName,
        normalizedName: row.advertiserName.toLowerCase().replace(/\s+/g, "-"),
        profileUrl: row.advertiserProfileUrl,
        website: row.advertiserWebsite,
        countries: row.advertiserCountries,
        metadataJson: {
          complianceBoundary: "public-or-authorized-only",
          sourceType: row.sourceType,
        },
      },
    });

    await prisma.competitor.upsert({
      where: {
        workspaceId_advertiserId: {
          workspaceId,
          advertiserId: advertiser.id,
        },
      },
      update: {},
      create: {
        workspaceId,
        advertiserId: advertiser.id,
      },
    });

    const ad = await prisma.ad.upsert({
      where: {
        platform_externalAdId: {
          platform: row.platform,
          externalAdId: row.adExternalId,
        },
      },
      update: {
        status: row.status,
        adFormat: row.adFormat,
        language: row.language,
        primaryText: row.primaryText,
        headline: row.headline,
        description: row.description,
        cta: row.cta,
        destinationUrl: row.destinationUrl,
        firstSeenAt: row.firstSeenAt,
        lastSeenAt: row.lastSeenAt,
        currentlyActive: row.currentlyActive,
        currency: row.currency,
        rawPayloadJson: row.rawPayload as any,
        creativeHash: sha256(JSON.stringify(row.creatives)),
        copyHash: sha256(`${row.primaryText || ""} ${row.headline || ""}`),
      },
      create: {
        advertiserId: advertiser.id,
        platform: row.platform,
        externalAdId: row.adExternalId,
        status: row.status,
        adFormat: row.adFormat,
        language: row.language,
        primaryText: row.primaryText,
        headline: row.headline,
        description: row.description,
        cta: row.cta,
        destinationUrl: row.destinationUrl,
        firstSeenAt: row.firstSeenAt,
        lastSeenAt: row.lastSeenAt,
        currentlyActive: row.currentlyActive,
        currency: row.currency,
        rawPayloadJson: row.rawPayload as any,
        creativeHash: sha256(JSON.stringify(row.creatives)),
        copyHash: sha256(`${row.primaryText || ""} ${row.headline || ""}`),
      },
    });

    await prisma.creative.deleteMany({ where: { adId: ad.id } });
    for (const creative of row.creatives) {
      await prisma.creative.create({
        data: {
          adId: ad.id,
          mediaType: creative.mediaType,
          mediaUrl: creative.mediaUrl,
          thumbnailUrl: creative.thumbnailUrl,
          width: creative.width,
          height: creative.height,
          durationMs: creative.durationMs,
          previewText: creative.previewText,
          metadataJson: creative.metadataJson as any,
        },
      });
    }

    await prisma.adSnapshot.create({
      data: {
        adId: ad.id,
        snapshotAt: new Date(),
        primaryText: row.primaryText,
        headline: row.headline,
        description: row.description,
        cta: row.cta,
        destinationUrl: row.destinationUrl,
        rawPayloadJson: row.rawPayload as any,
        changeSummary: "Automated connector snapshot refresh",
      },
    });

    const analysis = await analyzeMessaging({
      primaryText: row.primaryText,
      headline: row.headline,
      description: row.description,
      cta: row.cta,
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

    const activeRules = await prisma.alertRule.findMany({
      where: {
        workspaceId,
        isActive: true,
      },
    });

    for (const rule of activeRules) {
      const shouldCreate =
        (rule.type === "NEW_AD_DETECTED" && row.currentlyActive) ||
        (rule.type === "NEW_VIDEO" && row.adFormat === "VIDEO") ||
        (rule.type === "NEW_CTA" && Boolean(row.cta));

      if (!shouldCreate) continue;

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
            sourceType: row.sourceType,
            adExternalId: row.adExternalId,
            cta: row.cta,
          } as any,
          triggeredAt: new Date(),
        },
      });
    }
  }

  private async completeRun(
    runId: string,
    payload: {
      status: IngestionRunStatus;
      recordsIn: number;
      recordsOut: number;
      errors: Array<Record<string, unknown>>;
    },
  ) {
    await prisma.ingestionRun.update({
      where: { id: runId },
      data: {
        status: payload.status,
        recordsIn: payload.recordsIn,
        recordsOut: payload.recordsOut,
        errorsJson: payload.errors as any,
        finishedAt: new Date(),
      },
    });
  }
}

export function connectorFromSource(params: {
  type: IngestionSourceType;
  configJson: unknown;
}): IngestionConnector {
  if (params.type === "MOCK") {
    throw new Error("Connector 'MOCK' is disabled. Use a real data source such as META_PUBLIC.");
  }

  if (params.type === "META_PUBLIC") {
    const config = asRecord(params.configJson);
    return new MetaPublicConnector({
      accessToken: configString(config, "accessToken"),
      apiVersion: configString(config, "apiVersion"),
      searchTerms: configStringArray(config, "searchTerms"),
      countries: configStringArray(config, "countries"),
      adType: configString(config, "adType"),
      pageLimit: configNumber(config, "limit"),
      maxPages: configNumber(config, "maxPages"),
    });
  }

  throw new Error(
    `Connector '${params.type}' is not implemented yet. Supported runtime connector types: META_PUBLIC.`,
  );
}

export async function runIngestionForSource(params: {
  workspaceId: string;
  sourceType: IngestionSourceType;
  sourceId: string;
}) {
  try {
    const source = await prisma.ingestionSource.findUnique({
      where: { id: params.sourceId },
      select: { id: true, type: true, configJson: true, workspaceId: true },
    });

    if (!source) {
      throw new Error(`Ingestion source '${params.sourceId}' not found.`);
    }

    const connector = connectorFromSource({
      type: source.type,
      configJson: source.configJson,
    });

    const pipeline = new IngestionPipelineService(connector);
    return pipeline.run({ workspaceId: source.workspaceId || params.workspaceId, sourceId: params.sourceId });
  } catch (error) {
    await prisma.ingestionRun.create({
      data: {
        ingestionSourceId: params.sourceId,
        status: "FAILED",
        startedAt: new Date(),
        finishedAt: new Date(),
        recordsIn: 0,
        recordsOut: 0,
        errorsJson: [
          {
            message: error instanceof Error ? error.message : "Unexpected ingestion connector error",
            sourceType: params.sourceType,
          },
        ] as any,
      },
    });

    throw error;
  }
}
