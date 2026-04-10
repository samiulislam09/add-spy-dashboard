"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Card, CardDescription, CardTitle, Input } from "@cia/ui";

import { PageHeader } from "@/components/page-header";

async function fetchSavedSearches() {
  const res = await fetch("/api/saved-searches");
  if (!res.ok) throw new Error("Failed to fetch saved searches");
  return (await res.json()).data;
}

export default function SavedSearchesPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["saved-searches"], queryFn: fetchSavedSearches });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const name = String(formData.get("name") || "").trim();
      const filtersJson = {
        q: String(formData.get("q") || ""),
        platform: String(formData.get("platform") || ""),
      };

      if (!name) return;

      await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, filtersJson }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
    },
  });

  return (
    <main>
      <PageHeader
        title="Saved Searches"
        description="Store high-signal filters and relaunch them in one click."
      />

      <form
        action={(formData) => createMutation.mutate(formData)}
        className="mb-5 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4"
      >
        <Input name="name" placeholder="Search name" />
        <Input name="q" placeholder="Keyword" />
        <Input name="platform" placeholder="Platform (META/TIKTOK/GOOGLE)" />
        <Button type="submit">Save Search</Button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(query.data || []).map((item: any) => (
          <Card key={item.id}>
            <CardTitle>{item.name}</CardTitle>
            <CardDescription className="mt-2 text-xs">{JSON.stringify(item.filtersJson)}</CardDescription>
          </Card>
        ))}
      </div>
    </main>
  );
}
