import { resolve } from "node:path";

import { config as loadEnv } from "dotenv";

import { prisma } from "../src/client";

loadEnv({ path: resolve(process.cwd(), "../../.env") });
process.env.DATABASE_URL ||= "mysql://root:root@localhost:3306/competitor_ad_intelligence";

async function seed() {
  console.log("Seeding baseline workspace without dummy ads...");

  await prisma.alertEvent.deleteMany();
  await prisma.alertRule.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.collectionItem.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.messagingAnalysis.deleteMany();
  await prisma.adSnapshot.deleteMany();
  await prisma.landingPage.deleteMany();
  await prisma.creative.deleteMany();
  await prisma.adTagMap.deleteMany();
  await prisma.adTag.deleteMany();
  await prisma.ad.deleteMany();
  await prisma.competitor.deleteMany();
  await prisma.advertiser.deleteMany();
  await prisma.ingestionRun.deleteMany();
  await prisma.ingestionSource.deleteMany();
  await prisma.importFile.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: "demo@competitor-intelligence.local",
      name: "Demo Operator",
      role: "OWNER",
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      slug: "demo-store",
      name: "Demo Workspace",
    },
  });

  await prisma.membership.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      role: "OWNER",
    },
  });

  await prisma.ingestionSource.create({
    data: {
      workspaceId: workspace.id,
      type: "META_PUBLIC",
      name: "Meta Public Source",
      isEnabled: false,
      configJson: {
        complianceBoundary: "public-or-authorized-only",
        apiVersion: process.env.META_AD_LIBRARY_API_VERSION || "v22.0",
        searchTerms: [],
        countries: ["US"],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      action: "SEED_BASELINE",
      entityType: "Workspace",
      entityId: workspace.id,
      payloadJson: {
        seededAds: 0,
        mode: "no-dummy-data",
      },
    },
  });

  console.log("Seed complete:", {
    advertisers: 0,
    ads: 0,
    workspace: workspace.slug,
    user: user.email,
  });
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
