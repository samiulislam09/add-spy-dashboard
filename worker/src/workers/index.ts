import { Worker } from "bullmq";

import { redisConnection, QUEUE_NAMES } from "../queues";
import { runSyncAdvertiserAds } from "../jobs/sync";
import { refreshAdSnapshots } from "../jobs/snapshots";
import { dedupeCreatives } from "../jobs/dedupe";
import { computeMessagingAnalysis } from "../jobs/analysis";
import { generateAlertEvents } from "../jobs/alerts";

export function registerWorkers() {
  const syncWorker = new Worker(QUEUE_NAMES.syncAdvertiserAds, async (job: { data: { sourceId?: string; workspaceId?: string } }) => {
    return runSyncAdvertiserAds(job.data as { sourceId?: string; workspaceId?: string });
  }, { connection: redisConnection });

  const snapshotWorker = new Worker(QUEUE_NAMES.refreshSnapshots, async (job: { data: { workspaceId?: string } }) => {
    return refreshAdSnapshots(job.data as { workspaceId?: string });
  }, { connection: redisConnection });

  const dedupeWorker = new Worker(QUEUE_NAMES.dedupeCreatives, async () => {
    return dedupeCreatives();
  }, { connection: redisConnection });

  const analysisWorker = new Worker(QUEUE_NAMES.computeAnalysis, async (job: { data: { workspaceId?: string } }) => {
    return computeMessagingAnalysis(job.data as { workspaceId?: string });
  }, { connection: redisConnection });

  const alertWorker = new Worker(QUEUE_NAMES.generateAlerts, async (job: { data: { workspaceId?: string } }) => {
    return generateAlertEvents(job.data as { workspaceId?: string });
  }, { connection: redisConnection });

  return [syncWorker, snapshotWorker, dedupeWorker, analysisWorker, alertWorker];
}
