import { Queue } from "bullmq";
import IORedis from "ioredis";

import { env } from "@cia/utils";

const redis = new IORedis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

const queues = {
  sync: new Queue("sync-advertiser-ads", { connection: redis }),
  snapshots: new Queue("refresh-ad-snapshots", { connection: redis }),
  dedupe: new Queue("dedupe-creatives", { connection: redis }),
  analysis: new Queue("compute-messaging-analysis", { connection: redis }),
  alerts: new Queue("generate-alert-events", { connection: redis }),
};

export async function enqueueSyncJobs(payload: { sourceId?: string; workspaceId?: string }) {
  await queues.sync.add("manual-sync", payload, { removeOnComplete: 10, removeOnFail: 10 });
  await queues.snapshots.add("manual-snapshot", payload, { removeOnComplete: 10, removeOnFail: 10 });
  await queues.analysis.add("manual-analysis", payload, { removeOnComplete: 10, removeOnFail: 10 });
  await queues.alerts.add("manual-alert", payload, { removeOnComplete: 10, removeOnFail: 10 });
}

export async function enqueueRetryRun(payload: { sourceId?: string; workspaceId?: string }) {
  await queues.sync.add("retry-sync", payload, { removeOnComplete: 10, removeOnFail: 10 });
}
