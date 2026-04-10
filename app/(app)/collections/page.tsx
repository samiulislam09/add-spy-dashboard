"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge, Button, Card, CardDescription, CardTitle, Input } from "@cia/ui";

import { PageHeader } from "@/components/page-header";

async function fetchCollections() {
  const res = await fetch("/api/collections");
  if (!res.ok) throw new Error("Failed to load collections");
  const data = await res.json();
  return data.data;
}

export default function CollectionsPage() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["collections"],
    queryFn: fetchCollections,
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const name = String(formData.get("name") || "").trim();
      if (!name) return;

      await fetch("/api/collections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  return (
    <main>
      <PageHeader
        title="Collections"
        description="Organize ads into boards like Swipe File, Offers, and Competitor Watchlist."
      />

      <form
        action={(formData) => createMutation.mutate(formData)}
        className="mb-4 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row"
      >
        <Input name="name" placeholder="Create new board name" className="sm:max-w-sm" />
        <Button type="submit">Create Board</Button>
      </form>

      {query.isLoading ? <p className="text-sm text-slate-500">Loading collections...</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(query.data || []).map((collection: any) => (
          <Card key={collection.id}>
            <div className="flex items-start justify-between gap-2">
              <CardTitle>{collection.name}</CardTitle>
              <Badge>{collection.items.length} ads</Badge>
            </div>
            <CardDescription className="mt-1">{collection.description || "No description"}</CardDescription>

            <div className="mt-3 space-y-2">
              {collection.items.slice(0, 4).map((item: any) => (
                <div key={item.id} className="rounded-lg border border-slate-200 p-2 text-xs text-slate-600">
                  {item.ad.advertiser.name} — {item.ad.headline || "Untitled ad"}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
