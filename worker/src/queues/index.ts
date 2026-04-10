import { Queue } from "bullmq";
import IORedis from "ioredis";

import { env } from "@cia/utils";

export const QUEUE_NAMES = {
  syncAdvertiserAds: "sync-advertiser-ads",
  refreshSnapshots: "refresh-ad-snapshots",
  dedupeCreatives: "dedupe-creatives",
  computeAnalysis: "compute-messaging-analysis",
  generateAlerts: "generate-alert-events",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const redisConnection = new IORedis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

export function createQueue(name: QueueName) {
  return new Queue(name, { connection: redisConnection });
}

export const queues = {
  syncAdvertiserAds: createQueue(QUEUE_NAMES.syncAdvertiserAds),
  refreshSnapshots: createQueue(QUEUE_NAMES.refreshSnapshots),
  dedupeCreatives: createQueue(QUEUE_NAMES.dedupeCreatives),
  computeAnalysis: createQueue(QUEUE_NAMES.computeAnalysis),
  generateAlerts: createQueue(QUEUE_NAMES.generateAlerts),
};
