import { DistributionBarChart, DistributionDonutChart, SparkLineChart, Card, CardTitle } from "@cia/ui";

import { getDashboardData } from "@/lib/dashboard-data";
import { resolveWorkspaceContext } from "@/lib/workspace";
import { KpiGrid } from "@/components/kpi-grid";
import { PageHeader } from "@/components/page-header";

export default async function DashboardPage() {
  const { workspace } = await resolveWorkspaceContext();
  const dashboard = await getDashboardData(workspace.id);

  return (
    <main>
      <PageHeader
        title="Dashboard"
        description="Live overview of tracked advertisers, ad launches, and messaging movement."
        badge={workspace.slug}
      />

      <KpiGrid
        items={[
          { label: "Tracked advertisers", value: dashboard.kpis.trackedAdvertisers },
          { label: "Active ads", value: dashboard.kpis.activeAds },
          { label: "New ads (7d)", value: dashboard.kpis.newAds7d },
          { label: "Trend shifts", value: dashboard.kpis.messagingShiftSignals },
        ]}
      />

      <section className="mt-5 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardTitle>New ads over time</CardTitle>
          <div className="mt-4">
            <SparkLineChart data={dashboard.series.newAdsOverTime} xKey="date" yKey="value" />
          </div>
        </Card>
        <Card>
          <CardTitle>Platform mix</CardTitle>
          <div className="mt-4">
            <DistributionDonutChart data={dashboard.series.platformMix} nameKey="name" valueKey="value" />
          </div>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardTitle>CTA distribution</CardTitle>
          <div className="mt-4">
            <DistributionBarChart data={dashboard.series.ctaDistribution} xKey="name" yKey="value" />
          </div>
        </Card>
        <Card>
          <CardTitle>Ad format distribution</CardTitle>
          <div className="mt-4">
            <DistributionBarChart data={dashboard.series.formatDistribution} xKey="name" yKey="value" />
          </div>
        </Card>
        <Card>
          <CardTitle>Hook type distribution</CardTitle>
          <div className="mt-4">
            <DistributionBarChart data={dashboard.series.hookTypeDistribution} xKey="name" yKey="value" />
          </div>
        </Card>
      </section>
    </main>
  );
}
