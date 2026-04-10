import { Badge, Card, CardDescription, CardTitle } from "@cia/ui";
import { prisma } from "@cia/db";

import { PageHeader } from "@/components/page-header";
import { resolveWorkspaceContext } from "@/lib/workspace";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; leftId?: string; rightId?: string }>;
}) {
  const { workspace } = await resolveWorkspaceContext();
  const params = await searchParams;
  const type = params.type || "ads";

  const advertisers = await prisma.advertiser.findMany({
    where: { competitors: { some: { workspaceId: workspace.id } } },
    orderBy: { name: "asc" },
    take: 30,
  });

  const ads = await prisma.ad.findMany({
    where: { advertiser: { competitors: { some: { workspaceId: workspace.id } } } },
    include: { advertiser: true, analysis: true },
    orderBy: { lastSeenAt: "desc" },
    take: 100,
  });

  const leftId = params.leftId || (type === "advertisers" ? advertisers[0]?.id : ads[0]?.id);
  const rightId = params.rightId || (type === "advertisers" ? advertisers[1]?.id : ads[1]?.id);

  const left =
    type === "advertisers"
      ? advertisers.find((item: any) => item.id === leftId)
      : ads.find((item: any) => item.id === leftId);

  const right =
    type === "advertisers"
      ? advertisers.find((item: any) => item.id === rightId)
      : ads.find((item: any) => item.id === rightId);

  return (
    <main>
      <PageHeader
        title="Side-by-Side Compare"
        description="Compare two advertisers, ads, or periods and highlight messaging deltas quickly."
      />

      <form className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
        <select name="type" defaultValue={type} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
          <option value="ads">Compare two ads</option>
          <option value="advertisers">Compare two advertisers</option>
        </select>

        <select name="leftId" defaultValue={leftId} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
          {(type === "advertisers" ? advertisers : ads).map((item: any) => (
            <option key={item.id} value={item.id}>
              {type === "advertisers" ? item.name : `${item.advertiser.name}: ${item.headline || "Untitled"}`}
            </option>
          ))}
        </select>

        <select name="rightId" defaultValue={rightId} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
          {(type === "advertisers" ? advertisers : ads).map((item: any) => (
            <option key={item.id} value={item.id}>
              {type === "advertisers" ? item.name : `${item.advertiser.name}: ${item.headline || "Untitled"}`}
            </option>
          ))}
        </select>

        <button type="submit" className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white md:col-span-3">
          Compare
        </button>
      </form>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>Left</CardTitle>
          <CardDescription className="mt-2">
            {type === "advertisers" ? (left as any)?.name : (left as any)?.headline || "N/A"}
          </CardDescription>
          {type === "ads" ? (
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>
                <strong>Hook type:</strong> {(left as any)?.analysis?.hookType || "N/A"}
              </p>
              <p>
                <strong>CTA:</strong> {(left as any)?.cta || "N/A"}
              </p>
              <p>
                <strong>Tone:</strong> {(left as any)?.analysis?.tone || "N/A"}
              </p>
              <p>
                <strong>Value prop:</strong> {(left as any)?.analysis?.angle || "N/A"}
              </p>
            </div>
          ) : (
            <Badge className="mt-3">Platform: {(left as any)?.platform || "N/A"}</Badge>
          )}
        </Card>

        <Card>
          <CardTitle>Right</CardTitle>
          <CardDescription className="mt-2">
            {type === "advertisers" ? (right as any)?.name : (right as any)?.headline || "N/A"}
          </CardDescription>
          {type === "ads" ? (
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>
                <strong>Hook type:</strong> {(right as any)?.analysis?.hookType || "N/A"}
              </p>
              <p>
                <strong>CTA:</strong> {(right as any)?.cta || "N/A"}
              </p>
              <p>
                <strong>Tone:</strong> {(right as any)?.analysis?.tone || "N/A"}
              </p>
              <p>
                <strong>Value prop:</strong> {(right as any)?.analysis?.angle || "N/A"}
              </p>
            </div>
          ) : (
            <Badge className="mt-3">Platform: {(right as any)?.platform || "N/A"}</Badge>
          )}
        </Card>
      </section>
    </main>
  );
}
