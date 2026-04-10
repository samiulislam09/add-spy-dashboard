import { parse } from "csv-parse/sync";

import { BaseConnector } from "./base";
import type { ConnectorContext, NormalizedAdRecord } from "../types";

type CsvConnectorOptions = {
  csvContent: string;
};

export class CsvConnector extends BaseConnector {
  type = "CSV" as const;

  constructor(private readonly options: CsvConnectorOptions) {
    super();
  }

  async fetchAdvertisers(_ctx: ConnectorContext): Promise<Array<Record<string, unknown>>> {
    const rows = this.parseRows();
    const unique = new Map<string, Record<string, unknown>>();

    for (const row of rows) {
      const key = String(row.advertiserExternalId || row.advertiserName);
      if (!unique.has(key)) {
        unique.set(key, row);
      }
    }

    return [...unique.values()];
  }

  async fetchAds(_ctx: ConnectorContext): Promise<Array<Record<string, unknown>>> {
    return this.parseRows();
  }

  async fetchAdDetails(
    _ctx: ConnectorContext,
    adExternalId: string,
  ): Promise<Record<string, unknown> | null> {
    return this.parseRows().find((row) => String(row.adExternalId) === adExternalId) ?? null;
  }

  async normalizeRecord(raw: Record<string, unknown>): Promise<NormalizedAdRecord | null> {
    if (!raw.advertiserName || !raw.adExternalId) {
      return null;
    }

    return {
      sourceType: "CSV",
      platform: String(raw.platform || "OTHER") as NormalizedAdRecord["platform"],
      advertiserExternalId: String(raw.advertiserExternalId || raw.advertiserName),
      advertiserName: String(raw.advertiserName),
      advertiserProfileUrl: this.stringOrUndefined(raw.advertiserProfileUrl),
      advertiserWebsite: this.stringOrUndefined(raw.advertiserWebsite),
      advertiserCountries: String(raw.advertiserCountries || "US").split("|").filter(Boolean),
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
      currentlyActive: String(raw.currentlyActive || "false") === "true",
      currency: this.stringOrUndefined(raw.currency),
      creatives: [
        {
          mediaType: String(raw.mediaType || "image"),
          mediaUrl: String(raw.mediaUrl || "https://picsum.photos/900/700"),
          thumbnailUrl: this.stringOrUndefined(raw.thumbnailUrl),
          width: raw.width ? Number(raw.width) : undefined,
          height: raw.height ? Number(raw.height) : undefined,
          durationMs: raw.durationMs ? Number(raw.durationMs) : undefined,
          previewText: this.stringOrUndefined(raw.previewText),
        },
      ],
      rawPayload: raw,
    };
  }

  private parseRows(): Array<Record<string, unknown>> {
    return parse(this.options.csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<Record<string, unknown>>;
  }
}
