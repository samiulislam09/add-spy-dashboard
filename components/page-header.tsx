import { Badge } from "@cia/ui";

export function PageHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description?: string;
  badge?: string;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 border-b border-cyan-100 pb-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-[var(--font-grotesk)] text-2xl font-semibold tracking-tight text-cyan-950 md:text-3xl">
          {title}
        </h1>
        {badge ? <Badge variant="info">{badge}</Badge> : null}
      </div>
      {description ? <p className="max-w-3xl text-sm text-cyan-800 md:text-base">{description}</p> : null}
    </header>
  );
}
