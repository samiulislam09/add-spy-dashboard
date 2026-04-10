import Link from "next/link";

import { Badge, Button, Card } from "@cia/ui";

type AdCardProps = {
  ad: {
    id: string;
    platform: string;
    status: string;
    adFormat: string;
    firstSeenAt: Date;
    lastSeenAt: Date;
    headline: string | null;
    primaryText: string | null;
    cta: string | null;
    advertiser?: { name?: string | null } | null;
    creatives: Array<{ thumbnailUrl: string | null; mediaUrl: string }>;
    analysis?: {
      hookType?: string | null;
      angle?: string | null;
      tone?: string | null;
    } | null;
  };
};

export function AdCard({ ad }: AdCardProps) {
  const thumb = ad.creatives[0]?.thumbnailUrl || ad.creatives[0]?.mediaUrl || "https://picsum.photos/900/700";
  const advertiserName = ad.advertiser?.name || "Unknown advertiser";

  return (
    <Card className="rounded-2xl p-0 overflow-hidden">
      <div className="aspect-[16/10] bg-cyan-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb} alt={ad.headline || "Ad creative"} className="h-full w-full object-cover" />
      </div>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">{ad.platform}</Badge>
          <Badge variant={ad.status === "ACTIVE" ? "success" : "neutral"}>{ad.status}</Badge>
          <Badge>{ad.adFormat}</Badge>
        </div>

        <div>
          <p className="text-sm font-semibold text-cyan-950">{advertiserName}</p>
          <h3 className="mt-1 text-sm font-medium text-cyan-800">{ad.headline || "No headline"}</h3>
          <p className="mt-2 line-clamp-3 text-sm text-cyan-700">{ad.primaryText || "No copy available"}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {ad.analysis?.hookType ? <Badge>{ad.analysis.hookType}</Badge> : null}
          {ad.analysis?.angle ? <Badge>{ad.analysis.angle}</Badge> : null}
          {ad.cta ? <Badge variant="warning">{ad.cta}</Badge> : null}
        </div>

        <p className="text-xs text-cyan-700">
          First seen {ad.firstSeenAt.toLocaleDateString()} • Last seen {ad.lastSeenAt.toLocaleDateString()}
        </p>

        <Link href={`/ads/${ad.id}`}>
          <Button variant="secondary" className="w-full">
            Open Details
          </Button>
        </Link>
      </div>
    </Card>
  );
}
