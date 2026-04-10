import { BaseConnector } from "./base";
import type { ConnectorContext, NormalizedAdRecord } from "../types";

type MetaPublicConnectorOptions = {
  accessToken?: string;
  apiVersion?: string;
  searchTerms?: string[];
  countries?: string[];
  adType?: string;
  pageLimit?: number;
  maxPages?: number;
};

type UnknownRecord = Record<string, unknown>;

const DEFAULT_COUNTRIES = ["US"];
const DEFAULT_FIELDS = [
  "id",
  "page_id",
  "page_name",
  "ad_creation_time",
  "ad_delivery_start_time",
  "ad_delivery_stop_time",
  "ad_snapshot_url",
  "ad_reached_countries",
  "currency",
  "publisher_platforms",
  "ad_creative_bodies",
  "ad_creative_link_titles",
  "ad_creative_link_descriptions",
  "call_to_action_type",
  "link_url",
  "videos",
  "images",
].join(",");

function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as UnknownRecord;
}

function asRecordArray(value: unknown): UnknownRecord[] {
  if (!Array.isArray(value)) return [];
  return value.map(asRecord).filter((item): item is UnknownRecord => item !== null);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(asString).filter((item): item is string => Boolean(item));
}

function parseDate(value: unknown): Date | undefined {
  const str = asString(value);
  if (!str) return undefined;
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function firstStringFromKeys(record: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = asString(record[key]);
    if (value) return value;
  }
  return undefined;
}

export class MetaPublicConnector extends BaseConnector {
  type = "META_PUBLIC" as const;

  private readonly accessToken: string | undefined;
  private readonly apiVersion: string;
  private readonly searchTerms: string[];
  private readonly countries: string[];
  private readonly adType: string;
  private readonly pageLimit: number;
  private readonly maxPages: number;

  constructor(options: MetaPublicConnectorOptions = {}) {
    super();
    this.accessToken =
      options.accessToken || process.env.META_AD_LIBRARY_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
    this.apiVersion = options.apiVersion || process.env.META_AD_LIBRARY_API_VERSION || "v22.0";
    this.searchTerms = unique((options.searchTerms || []).map((value) => value.trim()).filter(Boolean));
    this.countries = unique((options.countries || DEFAULT_COUNTRIES).map((value) => value.toUpperCase()));
    this.adType = options.adType || "ALL";
    this.pageLimit = options.pageLimit ?? 100;
    this.maxPages = options.maxPages ?? 10;
  }

  private assertConfigured() {
    if (!this.accessToken) {
      throw new Error(
        "META_PUBLIC connector requires an access token. Set configJson.accessToken or META_AD_LIBRARY_ACCESS_TOKEN.",
      );
    }
    if (this.searchTerms.length === 0) {
      throw new Error(
        "META_PUBLIC connector requires at least one search term. Set configJson.searchTerms (comma-separated in UI).",
      );
    }
  }

  private buildInitialUrl(): string {
    this.assertConfigured();

    const params = new URLSearchParams();
    params.set("access_token", this.accessToken!);
    params.set("ad_type", this.adType);
    params.set("ad_reached_countries", JSON.stringify(this.countries));
    params.set("search_terms", this.searchTerms.join(" "));
    params.set("limit", String(this.pageLimit));
    params.set("fields", DEFAULT_FIELDS);
    return `https://graph.facebook.com/${this.apiVersion}/ads_archive?${params.toString()}`;
  }

  private async fetchArchiveRows(): Promise<UnknownRecord[]> {
    let nextUrl: string | undefined = this.buildInitialUrl();
    const rows: UnknownRecord[] = [];
    let pages = 0;

    while (nextUrl && pages < this.maxPages) {
      const response = await fetch(nextUrl, {
        headers: {
          accept: "application/json",
        },
      });

      const text = await response.text();
      let payload: UnknownRecord | null = null;
      try {
        payload = asRecord(text ? JSON.parse(text) : {});
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const apiMessage = payload && asRecord(payload.error) ? asString(asRecord(payload.error)?.message) : undefined;
        throw new Error(
          `Meta Ad Library request failed (${response.status}). ${apiMessage || response.statusText}`.trim(),
        );
      }

      const data = payload ? asRecordArray(payload.data) : [];
      rows.push(...data);

      const paging = payload ? asRecord(payload.paging) : null;
      nextUrl = paging ? asString(paging.next) : undefined;
      pages += 1;
    }

    return rows;
  }

  async fetchAdvertisers(_ctx: ConnectorContext): Promise<Array<Record<string, unknown>>> {
    const rows = await this.fetchArchiveRows();
    const seen = new Map<string, UnknownRecord>();

    for (const row of rows) {
      const pageId = asString(row.page_id) || asString(row.page_name);
      if (!pageId) continue;
      if (!seen.has(pageId)) {
        seen.set(pageId, row);
      }
    }

    return Array.from(seen.values());
  }

  async fetchAds(_ctx: ConnectorContext): Promise<Array<Record<string, unknown>>> {
    return this.fetchArchiveRows();
  }

  async fetchAdDetails(_ctx: ConnectorContext, adExternalId: string): Promise<Record<string, unknown> | null> {
    const rows = await this.fetchArchiveRows();
    return rows.find((row) => asString(row.id) === adExternalId) ?? null;
  }

  async normalizeRecord(raw: Record<string, unknown>): Promise<NormalizedAdRecord | null> {
    const adId = asString(raw.id);
    if (!adId) return null;

    const pageId = asString(raw.page_id) || asString(raw.page_name) || "unknown-page";
    const pageName = asString(raw.page_name) || pageId;
    const countries = asStringArray(raw.ad_reached_countries);

    const firstSeenAt =
      parseDate(raw.ad_delivery_start_time) || parseDate(raw.ad_creation_time) || parseDate(raw.created_time) || new Date();
    const stopAt = parseDate(raw.ad_delivery_stop_time);
    const lastSeenAt = stopAt || new Date();
    const currentlyActive = !stopAt || stopAt.getTime() > Date.now();

    const textBodies = asStringArray(raw.ad_creative_bodies);
    const titles = asStringArray(raw.ad_creative_link_titles);
    const descriptions = asStringArray(raw.ad_creative_link_descriptions);
    const cta = asString(raw.call_to_action_type);
    const destinationUrl = asString(raw.link_url) || asString(raw.ad_snapshot_url);

    const imageUrls = unique(
      [
        ...asRecordArray(raw.images).map((image) => firstStringFromKeys(image, ["url", "image_url"])),
        ...asRecordArray(raw.cards).map((card) => firstStringFromKeys(card, ["image_url", "url"])),
      ].filter((item): item is string => Boolean(item)),
    );

    const videoUrls = unique(
      [
        ...asRecordArray(raw.videos).map((video) => firstStringFromKeys(video, ["video_hd_url", "video_sd_url", "url"])),
        asString(raw.video_hd_url),
        asString(raw.video_sd_url),
      ].filter((item): item is string => Boolean(item)),
    );

    const creatives: NormalizedAdRecord["creatives"] = [];

    for (const mediaUrl of videoUrls) {
      creatives.push({
        mediaType: "video",
        mediaUrl,
        thumbnailUrl: imageUrls[0],
        metadataJson: { source: "meta-ad-library" },
      });
    }

    for (const mediaUrl of imageUrls) {
      creatives.push({
        mediaType: "image",
        mediaUrl,
        thumbnailUrl: mediaUrl,
        metadataJson: { source: "meta-ad-library" },
      });
    }

    if (creatives.length === 0) {
      const snapshot = asString(raw.ad_snapshot_url);
      if (snapshot) {
        creatives.push({
          mediaType: "image",
          mediaUrl: snapshot,
          thumbnailUrl: snapshot,
          metadataJson: { source: "meta-ad-library", fallback: true },
        });
      }
    }

    const adFormat: NormalizedAdRecord["adFormat"] =
      videoUrls.length > 0 ? "VIDEO" : imageUrls.length > 1 ? "CAROUSEL" : imageUrls.length === 1 ? "IMAGE" : "UNKNOWN";

    return {
      sourceType: "META_PUBLIC",
      platform: "META",
      advertiserExternalId: pageId,
      advertiserName: pageName,
      advertiserProfileUrl: pageId ? `https://www.facebook.com/${pageId}` : undefined,
      advertiserWebsite: undefined,
      advertiserCountries: countries.length > 0 ? countries : this.countries,
      adExternalId: adId,
      status: currentlyActive ? "ACTIVE" : "INACTIVE",
      adFormat,
      language: undefined,
      primaryText: textBodies[0],
      headline: titles[0],
      description: descriptions[0],
      cta,
      destinationUrl,
      firstSeenAt,
      lastSeenAt,
      currentlyActive,
      currency: asString(raw.currency),
      creatives,
      rawPayload: raw,
    };
  }
}
