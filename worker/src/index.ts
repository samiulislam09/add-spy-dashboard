import { QueueEvents } from "bullmq";

import { env } from "@cia/utils";

import { QUEUE_NAMES, redisConnection, queues } from "./queues";
import { registerWorkers } from "./workers";

async function bootstrap() {
  console.log("[worker] starting", {
    nodeEnv: env.NODE_ENV,
    redisHost: env.REDIS_HOST,
    redisPort: env.REDIS_PORT,
  });

  const workers = registerWorkers();

  const queueEvents = new QueueEvents(QUEUE_NAMES.syncAdvertiserAds, { connection: redisConnection });
  queueEvents.on("completed", ({ jobId }: { jobId: string }) => {
    console.log(`[worker] sync job completed: ${jobId}`);
  });
  queueEvents.on("failed", ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
    console.error(`[worker] sync job failed: ${jobId}`, failedReason);
  });

  await queues.syncAdvertiserAds.add(
    "initial-sync",
    {},
    {
      repeat: { every: 1000 * 60 * 30 },
      removeOnComplete: 20,
      removeOnFail: 20,
    },
  );

  await queues.refreshSnapshots.add(
    "snapshot-refresh",
    {},
    { repeat: { every: 1000 * 60 * 60 }, removeOnComplete: 20, removeOnFail: 20 },
  );

  await queues.computeAnalysis.add(
    "analysis-refresh",
    {},
    { repeat: { every: 1000 * 60 * 60 }, removeOnComplete: 20, removeOnFail: 20 },
  );

  await queues.generateAlerts.add(
    "alert-refresh",
    {},
    { repeat: { every: 1000 * 60 * 20 }, removeOnComplete: 20, removeOnFail: 20 },
  );

  process.on("SIGINT", async () => {
    console.log("[worker] shutting down");
    for (const worker of workers) {
      await worker.close();
    }
    await queueEvents.close();
    await redisConnection.quit();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  console.error("[worker] boot failed", error);
  process.exit(1);
});
