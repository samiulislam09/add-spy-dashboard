import { AdvertisersBrowser } from "@/components/advertisers-browser";
import { PageHeader } from "@/components/page-header";

export default async function AdvertisersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const q = Array.isArray(params.q) ? params.q[0] || "" : params.q || "";

  return (
    <main>
      <PageHeader
        title="Advertiser Directory"
        description="Search and inspect competitors, their latest ads, and messaging angles."
      />

      <AdvertisersBrowser initialQuery={q} />
    </main>
  );
}
