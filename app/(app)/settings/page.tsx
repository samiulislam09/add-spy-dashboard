import { Card, CardDescription, CardTitle, Badge } from "@cia/ui";

import { PageHeader } from "@/components/page-header";

export default function SettingsPage() {
  return (
    <main>
      <PageHeader
        title="Settings"
        description="Environment and embedding settings for workspace-scoped no-auth deployments."
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Authentication Mode</CardTitle>
            <Badge variant="warning">No-auth enabled</Badge>
          </div>
          <CardDescription className="mt-2">
            This app runs in embedded mode. Workspace context is determined from `x-store-id`, `storeId` query param, or fallback `DEFAULT_WORKSPACE_SLUG`.
          </CardDescription>
        </Card>

        <Card>
          <CardTitle>Compliance Boundary</CardTitle>
          <CardDescription className="mt-2">
            Ingestion connectors are intentionally limited to public or authorized sources. Private-login scraping and anti-bot evasion are out of scope by design.
          </CardDescription>
        </Card>
      </section>
    </main>
  );
}
