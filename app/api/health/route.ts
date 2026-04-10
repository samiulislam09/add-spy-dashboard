import { withApiErrors, ok } from "@/lib/http";

export async function GET() {
  return withApiErrors(async () =>
    ok({
      status: "ok",
      service: "competitor-ad-intelligence",
      timestamp: new Date().toISOString(),
    }),
  );
}
