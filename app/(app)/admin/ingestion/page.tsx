"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge, Button, Card, CardDescription, CardTitle, Input, Select } from "@cia/ui";

import { PageHeader } from "@/components/page-header";

const sourceTypeOptions = [
  { label: "Meta public source", value: "META_PUBLIC" },
  { label: "TikTok public source", value: "TIKTOK_PUBLIC" },
  { label: "Google transparency", value: "GOOGLE_TRANSPARENCY" },
  { label: "CSV import", value: "CSV" },
  { label: "JSON import", value: "JSON" },
];

const adminHeaders = {
  "x-admin-key": process.env.NEXT_PUBLIC_ADMIN_API_KEY || "local-admin-key",
};

async function fetchIngestion() {
  const res = await fetch("/api/admin/ingestion/runs", { headers: adminHeaders });
  if (!res.ok) throw new Error("Failed to fetch ingestion runs");
  return (await res.json()).data;
}

export default function AdminIngestionPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["ingestion-admin"], queryFn: fetchIngestion });

  const createSource = useMutation({
    mutationFn: async (formData: FormData) => {
      const type = String(formData.get("type") || "META_PUBLIC");
      const searchTerms = String(formData.get("metaSearchTerms") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const countries = String(formData.get("metaCountries") || "US")
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean);
      const apiVersion = String(formData.get("metaApiVersion") || "v22.0").trim();

      await fetch("/api/admin/ingestion/sources", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...adminHeaders,
        },
        body: JSON.stringify({
          name: String(formData.get("name") || ""),
          type,
          isEnabled: true,
          configJson:
            type === "META_PUBLIC"
              ? {
                  cadence: "manual+scheduled",
                  searchTerms,
                  countries,
                  apiVersion,
                }
              : { cadence: "manual+scheduled" },
        }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ingestion-admin"] });
    },
  });

  const backfill = useMutation({
    mutationFn: async (sourceId?: string) => {
      await fetch("/api/admin/ingestion/backfill", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...adminHeaders,
        },
        body: JSON.stringify({ sourceId }),
      });
    },
  });

  const retry = useMutation({
    mutationFn: async (sourceId?: string) => {
      await fetch("/api/admin/ingestion/retry", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...adminHeaders,
        },
        body: JSON.stringify({ sourceId }),
      });
    },
  });

  const sources = query.data?.sources || [];
  const runs = query.data?.runs || [];

  return (
    <main>
      <PageHeader
        title="Ingestion Admin"
        description="Configure connectors, inspect run history, retry failed runs, and trigger backfills."
      />

      <form
        action={(formData) => createSource.mutate(formData)}
        className="mb-4 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-6"
      >
        <Input name="name" placeholder="Connector name" />
        <Select name="type" options={sourceTypeOptions} />
        <Input name="metaSearchTerms" placeholder="Meta search terms (comma-separated)" />
        <Input name="metaCountries" placeholder="Meta countries (US,GB,AU)" defaultValue="US" />
        <Input name="metaApiVersion" placeholder="Meta API version" defaultValue="v22.0" />
        <Button type="submit">Create Source</Button>
      </form>

      <section className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sources.map((source: any) => (
          <Card key={source.id}>
            <div className="flex items-center justify-between">
              <CardTitle>{source.name}</CardTitle>
              <Badge variant={source.isEnabled ? "success" : "neutral"}>
                {source.isEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <CardDescription className="mt-1">{source.type}</CardDescription>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => backfill.mutate(source.id)}>
                Backfill
              </Button>
              <Button size="sm" variant="secondary" onClick={() => retry.mutate(source.id)}>
                Retry
              </Button>
            </div>
          </Card>
        ))}
      </section>

      <Card>
        <CardTitle>Run History</CardTitle>
        <div className="mt-3 overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2">Created</th>
                <th className="py-2">Source</th>
                <th className="py-2">Status</th>
                <th className="py-2">Records In</th>
                <th className="py-2">Records Out</th>
                <th className="py-2">Errors</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run: any) => (
                <tr key={run.id} className="border-t border-slate-100">
                  <td className="py-2">{new Date(run.createdAt).toLocaleString()}</td>
                  <td className="py-2">{run.ingestionSource.name}</td>
                  <td className="py-2">
                    <Badge
                      variant={
                        run.status === "SUCCESS"
                          ? "success"
                          : run.status === "FAILED"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {run.status}
                    </Badge>
                  </td>
                  <td className="py-2">{run.recordsIn}</td>
                  <td className="py-2">{run.recordsOut}</td>
                  <td className="py-2">{Array.isArray(run.errorsJson) ? run.errorsJson.length : 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
