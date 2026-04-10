import Link from "next/link";

import { Badge, Card, CardDescription, CardTitle, Button } from "@cia/ui";
import { getAdDetails, prisma } from "@cia/db";

import { PageHeader } from "@/components/page-header";
import { resolveWorkspaceContext } from "@/lib/workspace";

export default async function AdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await resolveWorkspaceContext();
  const ad = await getAdDetails(id, workspace.id);

  if (!ad) {
    return (
      <main>
        <PageHeader title="Ad not found" />
        <Link className="text-sm underline" href="/library">
          Return to library
        </Link>
      </main>
    );
  }

  const previous = ad.snapshots[1] || null;

  const siblingAds = await prisma.ad.findMany({
    where: {
      advertiserId: ad.advertiserId,
      id: { not: ad.id },
    },
    include: {
      creatives: { take: 1 },
      analysis: true,
      advertiser: true,
    },
    take: 6,
  });

  return (
    <main>
      <PageHeader
        title={ad.headline || "Ad detail"}
        description="Creative, metadata, copy, AI analysis, and snapshot history in one view."
        badge={ad.advertiser.name}
      />

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardTitle>Creative Carousel</CardTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {ad.creatives.map((creative: any) => (
              <div key={creative.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={creative.thumbnailUrl || creative.mediaUrl}
                  alt={creative.previewText || "Creative"}
                  className="h-40 w-full object-cover"
                />
                <div className="p-3 text-xs text-slate-500">
                  {creative.mediaType.toUpperCase()} {creative.durationMs ? `• ${Math.round(creative.durationMs / 1000)}s` : ""}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Metadata</CardTitle>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>
              <strong>Status:</strong> {ad.status}
            </p>
            <p>
              <strong>Platform:</strong> {ad.platform}
            </p>
            <p>
              <strong>Format:</strong> {ad.adFormat}
            </p>
            <p>
              <strong>First seen:</strong> {ad.firstSeenAt.toLocaleDateString()}
            </p>
            <p>
              <strong>Last seen:</strong> {ad.lastSeenAt.toLocaleDateString()}
            </p>
            <p>
              <strong>Landing:</strong>{" "}
              <a className="underline" href={ad.destinationUrl || "#"} target="_blank" rel="noreferrer">
                {ad.destinationUrl || "N/A"}
              </a>
            </p>
          </div>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Full Copy</CardTitle>
          <p className="mt-3 text-sm text-slate-700">{ad.primaryText}</p>
          <p className="mt-2 text-sm text-slate-500">{ad.description}</p>
          {ad.cta ? <Badge className="mt-3">CTA: {ad.cta}</Badge> : null}
        </Card>

        <Card>
          <CardTitle>Messaging Analysis</CardTitle>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>
              <strong>Hook:</strong> {ad.analysis?.hook || "N/A"}
            </p>
            <p>
              <strong>Hook Type:</strong> {ad.analysis?.hookType || "N/A"}
            </p>
            <p>
              <strong>Tone:</strong> {ad.analysis?.tone || "N/A"}
            </p>
            <p>
              <strong>CTA Type:</strong> {ad.analysis?.ctaType || "N/A"}
            </p>
            <p>
              <strong>Offer:</strong> {ad.analysis?.offerType || "N/A"}
            </p>
            <p>
              <strong>Summary:</strong> {ad.analysis?.summary || "N/A"}
            </p>
          </div>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Snapshot Timeline</CardTitle>
          <div className="mt-3 space-y-2">
            {ad.snapshots.map((snapshot: any) => (
              <div key={snapshot.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-medium text-slate-700">{snapshot.snapshotAt.toLocaleDateString()}</p>
                <p className="text-slate-500">{snapshot.changeSummary || "No summary"}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Compare to Previous Snapshot</CardTitle>
          {previous ? (
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>
                <strong>Headline:</strong>
              </p>
              <p className="rounded-lg bg-slate-50 p-2">Before: {previous.headline || "N/A"}</p>
              <p className="rounded-lg bg-emerald-50 p-2">Now: {ad.headline || "N/A"}</p>
              <p>
                <strong>CTA:</strong> {previous.cta || "N/A"} → {ad.cta || "N/A"}
              </p>
            </div>
          ) : (
            <CardDescription className="mt-3">No previous snapshot available.</CardDescription>
          )}
        </Card>
      </section>

      <section className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-[var(--font-grotesk)] text-xl font-semibold">Other Ads by Advertiser</h2>
          <Link href={`/compare?type=ads&leftId=${ad.id}&rightId=${siblingAds[0]?.id || ad.id}`}>
            <Button variant="secondary">Compare Ads</Button>
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {siblingAds.map((item: any) => (
            <Link key={item.id} href={`/ads/${item.id}`}>
              <Card className="transition hover:-translate-y-0.5">
                <CardTitle className="text-sm">{item.headline || "Untitled ad"}</CardTitle>
                <CardDescription className="mt-1">{item.analysis?.summary || "No analysis"}</CardDescription>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
