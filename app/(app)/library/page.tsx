import Link from "next/link";

import { adFilterSchema } from "@cia/types";
import { listAds } from "@cia/db";
import { Button } from "@cia/ui";

import { AdCard } from "@/components/ad-card";
import { LibraryFilters } from "@/components/library-filters";
import { LibraryViewToggle } from "@/components/library-view-toggle";
import { PageHeader } from "@/components/page-header";
import { resolveWorkspaceContext } from "@/lib/workspace";

export default async function AdLibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = adFilterSchema.parse({
    ...params,
    page: params.page || "1",
    pageSize: params.pageSize || "24",
  });

  const { workspace } = await resolveWorkspaceContext();
  const result = await listAds(workspace.id, filters);

  const qp = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => typeof v === "string")
      .map(([k, v]) => [k, String(v)]),
  );
  qp.set("format", "csv");

  return (
    <main>
      <PageHeader
        title="Ad Library"
        description="Search and filter current and historical ads with high-speed faceted filtering."
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <LibraryViewToggle />
        <Link href={`/api/ads?${qp.toString()}`}>
          <Button variant="secondary">Export CSV</Button>
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-[290px_1fr]">
        <LibraryFilters />
        <div>
          <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
            <span>
              Showing {result.items.length} of {result.total} ads
            </span>
            <span>
              Page {result.page} / {Math.max(result.totalPages, 1)}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.items.map((ad: any) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <Link
              href={`/library?${new URLSearchParams({ ...Object.fromEntries(qp), page: String(Math.max(filters.page - 1, 1)), format: "" }).toString()}`}
            >
              <Button variant="secondary" disabled={filters.page <= 1}>
                Previous
              </Button>
            </Link>
            <Link
              href={`/library?${new URLSearchParams({ ...Object.fromEntries(qp), page: String(filters.page + 1), format: "" }).toString()}`}
            >
              <Button variant="secondary" disabled={filters.page >= result.totalPages}>
                Next
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
