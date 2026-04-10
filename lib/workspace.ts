import { headers } from "next/headers";
import { NextRequest } from "next/server";

import { prisma } from "@cia/db";
import { env } from "@cia/utils";

export async function resolveWorkspaceSlugFromRequest(req?: NextRequest): Promise<string> {
  if (req) {
    const queryStoreId = req.nextUrl.searchParams.get("storeId") || req.nextUrl.searchParams.get("store_id");
    const headerStoreId = req.headers.get("x-store-id");

    return queryStoreId || headerStoreId || env.DEFAULT_WORKSPACE_SLUG;
  }

  const headerStore = await headers();
  return (
    headerStore.get("x-store-id") ||
    headerStore.get("x-workspace-id") ||
    env.DEFAULT_WORKSPACE_SLUG
  );
}

export async function resolveWorkspaceContext(req?: NextRequest) {
  const slug = await resolveWorkspaceSlugFromRequest(req);
  const workspace = await prisma.workspace.findUnique({ where: { slug } });

  if (!workspace) {
    throw new Error(`Workspace '${slug}' not found. Seed data first or pass a valid x-store-id.`);
  }

  const fallbackUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!fallbackUser) {
    throw new Error("No user found. Seed the database first.");
  }

  return {
    workspace,
    user: fallbackUser,
    authEnabled: env.ENABLE_AUTH,
  };
}
