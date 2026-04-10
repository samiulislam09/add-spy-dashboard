import { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@cia/db";

import { withApiErrors, ok, parseBody } from "@/lib/http";
import { assertAdmin } from "@/lib/security";
import { resolveWorkspaceContext } from "@/lib/workspace";

const sourceSchema = z.object({
  type: z.enum(["META_PUBLIC", "TIKTOK_PUBLIC", "GOOGLE_TRANSPARENCY", "CSV", "JSON"]),
  name: z.string().min(1).max(120),
  isEnabled: z.boolean().default(true),
  configJson: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: NextRequest) {
  return withApiErrors(async () => {
    assertAdmin(request);
    const { workspace } = await resolveWorkspaceContext(request);
    const items = await prisma.ingestionSource.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { updatedAt: "desc" },
    });
    return ok(items);
  });
}

export async function POST(request: NextRequest) {
  return withApiErrors(async () => {
    assertAdmin(request);
    const payload = await parseBody(request, sourceSchema);
    const { workspace } = await resolveWorkspaceContext(request);

    const source = await prisma.ingestionSource.create({
      data: {
        workspaceId: workspace.id,
        type: payload.type,
        name: payload.name,
        isEnabled: payload.isEnabled,
        configJson: {
          ...(payload.configJson || {}),
          complianceBoundary: "public-or-authorized-only",
        },
      },
    });

    return ok(source, { status: 201 });
  });
}
