import { BaseConnector } from "./base";
import type { ConnectorContext, NormalizedAdRecord } from "../types";

type JsonConnectorOptions = {
  payload: Array<Record<string, unknown>>;
};

export class JsonConnector extends BaseConnector {
  type = "JSON" as const;

  constructor(private readonly options: JsonConnectorOptions) {
    super();
  }

  async fetchAdvertisers(_ctx: ConnectorContext): Promise<Array<Record<string, unknown>>> {
    const map = new Map<string, Record<string, unknown>>();
    for (const row of this.options.payload) {
      const id = String(row.advertiserExternalId || row.advertiserName || "unknown");
      if (!map.has(id)) map.set(id, row);
    }
    return [...map.values()];
  }

  async fetchAds(_ctx: ConnectorContext): Promise<Array<Record<string, unknown>>> {
    return this.options.payload;
  }

  async fetchAdDetails(
    _ctx: ConnectorContext,
    adExternalId: string,
  ): Promise<Record<string, unknown> | null> {
    return this.options.payload.find((row) => String(row.adExternalId) === adExternalId) ?? null;
  }

  async normalizeRecord(raw: Record<string, unknown>): Promise<NormalizedAdRecord | null> {
    if (!raw.advertiserName || !raw.adExternalId) {
      return null;
    }

    return {
      sourceType: "JSON",
      platform: String(raw.platform || "OTHER") as NormalizedAdRecord["platform"],
      advertiserExternalId: String(raw.advertiserExternalId || raw.advertiserName),
      advertiserName: String(raw.advertiserName),
      advertiserProfileUrl: this.stringOrUndefined(raw.advertiserProfileUrl),
      advertiserWebsite: this.stringOrUndefined(raw.advertiserWebsite),
      advertiserCountries: Array.isArray(raw.advertiserCountries)
        ? raw.advertiserCountries.map((x) => String(x))
        : ["US"],
      adExternalId: String(raw.adExternalId),
      status: String(raw.status || "UNKNOWN") as NormalizedAdRecord["status"],
      adFormat: String(raw.adFormat || "UNKNOWN") as NormalizedAdRecord["adFormat"],
      language: this.stringOrUndefined(raw.language),
      primaryText: this.stringOrUndefined(raw.primaryText),
      headline: this.stringOrUndefined(raw.headline),
      description: this.stringOrUndefined(raw.description),
      cta: this.stringOrUndefined(raw.cta),
      destinationUrl: this.stringOrUndefined(raw.destinationUrl),
      firstSeenAt: new Date(String(raw.firstSeenAt || new Date().toISOString())),
      lastSeenAt: new Date(String(raw.lastSeenAt || new Date().toISOString())),
      currentlyActive: Boolean(raw.currentlyActive),
      currency: this.stringOrUndefined(raw.currency),
      creatives: Array.isArray(raw.creatives)
        ? (raw.creatives as NormalizedAdRecord["creatives"])
        : [
            {
              mediaType: "image",
              mediaUrl: "https://picsum.photos/900/700",
            },
          ],
      rawPayload: raw,
    };
  }
}
