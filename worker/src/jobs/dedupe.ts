import { prisma } from "@cia/db";

export async function dedupeCreatives() {
  const creatives = await prisma.creative.findMany({
    orderBy: { createdAt: "desc" },
  });

  const seen = new Set<string>();
  let removed = 0;

  for (const creative of creatives) {
    const key = `${creative.adId}:${creative.mediaUrl}`;
    if (seen.has(key)) {
      await prisma.creative.delete({ where: { id: creative.id } });
      removed += 1;
    } else {
      seen.add(key);
    }
  }

  return { removed };
}
