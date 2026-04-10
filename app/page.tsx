import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, SearchCheck } from "lucide-react";

import { Badge, Button, Card, CardDescription, CardTitle } from "@cia/ui";

export default function LandingPage() {
  return (
    <main className="container-shell py-12 md:py-20">
      <section className="rounded-[2rem] border border-cyan-100 bg-white/90 p-8 shadow-xl shadow-cyan-100/80 backdrop-blur md:p-12">
        <Badge variant="info" className="mb-5">
          Public/Authorized Data Only
        </Badge>
        <h1 className="max-w-3xl font-[var(--font-grotesk)] text-4xl font-semibold leading-tight tracking-tight text-cyan-950 md:text-6xl">
          Competitor Ad Intelligence for teams that move faster than the market.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-cyan-800">
          Search competitors, track ad launches, compare messaging angles, and catch creative shifts before your next campaign planning call.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/dashboard">
            <Button size="lg" className="w-full sm:w-auto">
              Open Platform
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/library">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Browse Ad Library
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Card>
          <ShieldCheck className="mb-3 h-5 w-5 text-emerald-600" />
          <CardTitle>Compliance by Design</CardTitle>
          <CardDescription className="mt-2">
            Connectors only ingest public or explicitly authorized sources. No hidden login scraping.
          </CardDescription>
        </Card>
        <Card>
          <SearchCheck className="mb-3 h-5 w-5 text-cyan-600" />
          <CardTitle>Fast Faceted Search</CardTitle>
          <CardDescription className="mt-2">
            Filter by platform, format, CTA, hook type, tone, date ranges, and country.
          </CardDescription>
        </Card>
        <Card>
          <Sparkles className="mb-3 h-5 w-5 text-teal-600" />
          <CardTitle>AI Messaging Analysis</CardTitle>
          <CardDescription className="mt-2">
            Deterministic extraction plus optional LLM enhancement for insights your team can trust.
          </CardDescription>
        </Card>
      </section>
    </main>
  );
}
