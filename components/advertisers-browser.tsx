"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Badge, Button, Card, CardDescription, CardTitle, Input } from "@cia/ui";

type AdvertiserItem = {
  id: string;
  name: string;
  platform: string;
  countries?: unknown;
  _count?: { ads?: number };
  ads?: Array<{ currentlyActive?: boolean }>;
};

async function fetchAdvertisers(params: { query: string; storeId?: string }) {
  const qp = new URLSearchParams();
  if (params.query) qp.set("q", params.query);
  if (params.storeId) qp.set("storeId", params.storeId);

  const response = await fetch(`/api/advertisers?${qp.toString()}`, {
    headers: params.storeId ? { "x-store-id": params.storeId } : undefined,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || "Failed to load advertisers");
  }

  const payload = await response.json();
  return (payload.data || []) as AdvertiserItem[];
}

export function AdvertisersBrowser({ initialQuery }: { initialQuery: string }) {
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);

  const storeId = useMemo(
    () => searchParams.get("storeId") || searchParams.get("store_id") || undefined,
    [searchParams],
  );

  const advertisersQuery = useQuery({
    queryKey: ["advertisers", query, storeId],
    queryFn: () => fetchAdvertisers({ query, storeId }),
  });

  const advertisers = advertisersQuery.data || [];

  return (
    <>
      <form
        className="mb-5 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          const next = draft.trim();
          setQuery(next);

          const qp = new URLSearchParams(searchParams.toString());
          if (next) qp.set("q", next);
          else qp.delete("q");
          const nextPath = qp.toString() ? `/advertisers?${qp.toString()}` : "/advertisers";
          window.history.replaceState(null, "", nextPath);
        }}
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          name="q"
          placeholder="Search advertiser..."
          className="sm:max-w-lg"
        />
        <div className="flex gap-2">
          <Button type="submit" variant="secondary">
            Search
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setDraft("");
              setQuery("");
              const qp = new URLSearchParams(searchParams.toString());
              qp.delete("q");
              const nextPath = qp.toString() ? `/advertisers?${qp.toString()}` : "/advertisers";
              window.history.replaceState(null, "", nextPath);
            }}
          >
            Clear
          </Button>
        </div>
      </form>

      {advertisersQuery.isLoading ? (
        <p className="text-sm text-cyan-700">Loading advertisers...</p>
      ) : advertisersQuery.error ? (
        <p className="text-sm text-rose-700">{(advertisersQuery.error as Error).message}</p>
      ) : advertisers.length === 0 ? (
        <p className="text-sm text-cyan-700">No advertisers found for this search.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {advertisers.map((adv) => (
            <Link
              key={adv.id}
              href={storeId ? `/advertisers/${adv.id}?storeId=${encodeURIComponent(storeId)}` : `/advertisers/${adv.id}`}
            >
              <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>{adv.name}</CardTitle>
                  <Badge variant="info">{adv.platform}</Badge>
                </div>
                <CardDescription className="mt-2 line-clamp-2">
                  Countries: {Array.isArray(adv.countries) ? adv.countries.join(", ") : "N/A"}
                </CardDescription>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-cyan-700">
                  <span>{adv._count?.ads || 0} tracked ads</span>
                  <span>•</span>
                  <span>{(adv.ads || []).filter((ad) => ad.currentlyActive).length} active</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {advertisersQuery.isFetching && !advertisersQuery.isLoading ? (
        <p className="mt-3 text-xs text-cyan-600">Refreshing results...</p>
      ) : null}
    </>
  );
}
