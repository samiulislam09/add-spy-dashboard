import type { ConnectorContext, IngestionConnector, NormalizedAdRecord } from "../types";

export abstract class BaseConnector implements IngestionConnector {
  abstract type: IngestionConnector["type"];

  abstract fetchAdvertisers(ctx: ConnectorContext): Promise<Array<Record<string, unknown>>>;
  abstract fetchAds(ctx: ConnectorContext): Promise<Array<Record<string, unknown>>>;
  abstract fetchAdDetails(
    ctx: ConnectorContext,
    adExternalId: string,
  ): Promise<Record<string, unknown> | null>;
  abstract normalizeRecord(raw: Record<string, unknown>): Promise<NormalizedAdRecord | null>;

  protected stringOrUndefined(value: unknown): string | undefined {
    return typeof value === "string" && value.trim().length > 0 ? value : undefined;
  }
}
