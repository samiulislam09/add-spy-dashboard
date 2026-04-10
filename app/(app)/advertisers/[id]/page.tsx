import Link from "next/link";

import { Badge, Card, CardDescription, CardTitle } from "@cia/ui";
import { getAdvertiserDetails } from "@cia/db";

import { AdCard } from "@/components/ad-card";
import { PageHeader } from "@/components/page-header";
import { resolveWorkspaceContext } from "@/lib/workspace";

export default async function AdvertiserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { workspace } = await resolveWorkspaceContext();
  const advertiser = await getAdvertiserDetails(id, workspace.id);

  if (!advertiser) {
    return (
      <main>
        <PageHeader title="Advertiser not found" />
        <Link href="/advertisers" className="text-sm text-slate-600 underline">
          Back to directory
        </Link>
      </main>
    );
  }

  const topAngles = advertiser.ads
    .map((ad: any) => ad.analysis?.angle)
    .filter(Boolean)
    .slice(0, 5) as string[];

  return (
    <main>
      <PageHeader
        title={advertiser.name}
        description="Advertiser profile with latest creatives, messaging, and territory footprint."
        badge={advertiser.platform}
      />

      <section className="mb-5 grid gap-4 md:grid-cols-3">
        <Card>
          <CardTitle>Active Countries</CardTitle>
          <CardDescription className="mt-2">
            {(advertiser.countries as string[]).join(", ") || "N/A"}
          </CardDescription>
        </Card>
        <Card>
          <CardTitle>Top Messaging Angles</CardTitle>
          <div className="mt-2 flex flex-wrap gap-2">
            {topAngles.length === 0 ? <p className="text-sm text-slate-500">No analysis yet</p> : null}
            {topAngles.map((angle: string, idx: number) => (
              <Badge key={`${angle}-${idx}`}>{angle}</Badge>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>Website</CardTitle>
          <CardDescription className="mt-2">
            <a href={advertiser.website || "#"} target="_blank" rel="noreferrer" className="underline">
              {advertiser.website || "N/A"}
            </a>
          </CardDescription>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 font-[var(--font-grotesk)] text-xl font-semibold">Latest Ads</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {advertiser.ads.map((ad: any) => (
            <AdCard key={ad.id} ad={{ ...ad, advertiser: { name: advertiser.name } }} />
          ))}
        </div>
      </section>
    </main>
  );
}
