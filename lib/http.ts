import { ZodError, type ZodSchema } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json({ data }, init);
}

export function fail(error: string, status = 400, details?: unknown) {
  return Response.json(
    {
      error,
      details,
    },
    { status },
  );
}

export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  const body = await req.json();
  return schema.parse(body);
}

export function parseSearchParams<T>(url: URL, schema: ZodSchema<T>): T {
  const values = Object.fromEntries(url.searchParams.entries());
  return schema.parse(values);
}

export function withApiErrors(fn: () => Promise<Response>) {
  return fn().catch((error) => {
    if (error instanceof ZodError) {
      return fail("Validation error", 400, error.flatten());
    }

    return fail(error instanceof Error ? error.message : "Internal error", 500);
  });
}
