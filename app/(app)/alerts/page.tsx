"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge, Button, Card, CardDescription, CardTitle, Input, Select } from "@cia/ui";

import { PageHeader } from "@/components/page-header";

const ruleTypeOptions = [
  { label: "New ad detected", value: "NEW_AD_DETECTED" },
  { label: "Ad copy changed", value: "COPY_CHANGED" },
  { label: "New offer detected", value: "NEW_OFFER" },
  { label: "New CTA detected", value: "NEW_CTA" },
  { label: "Competitor launches video ads", value: "NEW_VIDEO" },
  { label: "Competitor starts in new country", value: "NEW_COUNTRY" },
];

async function fetchAlerts() {
  const res = await fetch("/api/alerts");
  if (!res.ok) throw new Error("Failed to load alerts");
  return (await res.json()).data;
}

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["alerts"], queryFn: fetchAlerts });

  const createRule = useMutation({
    mutationFn: async (formData: FormData) => {
      const name = String(formData.get("name") || "").trim();
      const type = String(formData.get("type") || "NEW_AD_DETECTED");
      const conditionsJson = { keyword: String(formData.get("keyword") || "") };

      if (!name) return;

      await fetch("/api/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, type, conditionsJson, isActive: true }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const rules = query.data?.rules || [];
  const events = query.data?.events || [];

  return (
    <main>
      <PageHeader
        title="Alerts"
        description="Create change-detection rules for ad launches, copy shifts, and new offers."
      />

      <form
        action={(formData) => createRule.mutate(formData)}
        className="mb-5 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4"
      >
        <Input name="name" placeholder="Rule name" />
        <Select name="type" options={ruleTypeOptions} />
        <Input name="keyword" placeholder="Optional keyword filter" />
        <Button type="submit">Create rule</Button>
      </form>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Active Rules</CardTitle>
          <div className="mt-3 space-y-2">
            {rules.map((rule: any) => (
              <div key={rule.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-800">{rule.name}</p>
                  <Badge variant={rule.isActive ? "success" : "neutral"}>
                    {rule.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>
                <CardDescription className="mt-1">{rule.type}</CardDescription>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Recent Alert Events</CardTitle>
          <div className="mt-3 space-y-2">
            {events.map((event: any) => (
              <div key={event.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-medium text-slate-800">{event.eventType}</p>
                <p className="text-slate-500">Rule: {event.alertRule.name}</p>
                <p className="text-slate-500">{new Date(event.triggeredAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
