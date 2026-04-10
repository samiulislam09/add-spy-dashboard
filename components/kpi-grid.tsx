import { Card, CardDescription, CardTitle } from "@cia/ui";

type Kpi = {
  label: string;
  value: number | string;
  description?: string;
};

export function KpiGrid({ items }: { items: Kpi[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="rounded-2xl">
          <CardDescription className="text-xs uppercase tracking-wide">{item.label}</CardDescription>
          <CardTitle className="mt-2 text-3xl font-semibold">{item.value}</CardTitle>
          {item.description ? <p className="mt-2 text-xs text-cyan-700">{item.description}</p> : null}
        </Card>
      ))}
    </div>
  );
}
