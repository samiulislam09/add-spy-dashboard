import { NextRequest } from "next/server";

import { adFilterSchema } from "@cia/types";
import { listAds } from "@cia/db";

import { withApiErrors, ok, parseSearchParams } from "@/lib/http";
import { resolveWorkspaceContext } from "@/lib/workspace";

export async function GET(request: NextRequest) {
  return withApiErrors(async () => {
    const url = new URL(request.url);
    const format = url.searchParams.get("format");
    const filters = parseSearchParams(url, adFilterSchema);
    const { workspace } = await resolveWorkspaceContext(request);
    const result = await listAds(workspace.id, filters);

    if (format === "csv") {
      const rows = [
        [
          "adId",
          "advertiser",
          "platform",
          "status",
          "adFormat",
          "cta",
          "hookType",
          "offerType",
          "firstSeenAt",
          "lastSeenAt",
        ],
        ...result.items.map((ad: any) => [
          ad.id,
          ad.advertiser.name,
          ad.platform,
          ad.status,
          ad.adFormat,
          ad.cta || "",
          ad.analysis?.hookType || "",
          ad.analysis?.offerType || "",
          ad.firstSeenAt.toISOString(),
          ad.lastSeenAt.toISOString(),
        ]),
      ];
      const csv = rows
        .map((r) => r.map((v: string) => `"${String(v).replaceAll("\"", '""')}"`).join(","))
        .join("\n");

      return new Response(csv, {
        headers: {
          "content-type": "text/csv",
          "content-disposition": "attachment; filename=ad-library-export.csv",
        },
      });
    }

    return ok(result);
  });
}
