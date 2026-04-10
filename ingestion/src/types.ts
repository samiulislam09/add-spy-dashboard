export type Platform = "META" | "TIKTOK" | "GOOGLE" | "OTHER";

export type IngestionSourceType =
  | "META_PUBLIC"
  | "TIKTOK_PUBLIC"
  | "GOOGLE_TRANSPARENCY"
  | "CSV"
  | "JSON"
  | "MOCK";

export type NormalizedAdRecord = {
  sourceType: IngestionSourceType;
  platform: Platform;
  advertiserExternalId: string;
  advertiserName: string;
  advertiserProfileUrl?: string;
  advertiserWebsite?: string;
  advertiserCountries: string[];
  adExternalId: string;
  status: "ACTIVE" | "INACTIVE" | "PAUSED" | "UNKNOWN";
  adFormat: "IMAGE" | "VIDEO" | "CAROUSEL" | "TEXT" | "COLLECTION" | "UNKNOWN";
  language?: string;
  primaryText?: string;
  headline?: string;
  description?: string;
  cta?: string;
  destinationUrl?: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  currentlyActive: boolean;
  currency?: string;
  creatives: Array<{
    mediaType: string;
    mediaUrl: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    durationMs?: number;
    previewText?: string;
    metadataJson?: Record<string, unknown>;
  }>;
  rawPayload: Record<string, unknown>;
};

export type ConnectorContext = {
  workspaceId: string;
  sourceId: string;
  dryRun?: boolean;
};

export interface IngestionConnector {
  type: IngestionSourceType;
  fetchAdvertisers(ctx: ConnectorContext): Promise<Array<Record<string, unknown>>>;
  fetchAds(ctx: ConnectorContext): Promise<Array<Record<string, unknown>>>;
  fetchAdDetails(ctx: ConnectorContext, adExternalId: string): Promise<Record<string, unknown> | null>;
  normalizeRecord(raw: Record<string, unknown>): Promise<NormalizedAdRecord | null>;
}
