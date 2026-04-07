import { Queue, Worker, QueueOptions, WorkerOptions } from 'bullmq';
import redis from '../config/redis';
import { isRedisAvailable } from '../config/redis';
import { bulkUploadProcessor } from '../services/bulkUploadService';
import { logger } from '../utils/logger';

const queueName = 'bulkUploadQueue';

let bulkUploadQueue: Queue | null = null;

try {
  if (redis) {
    const queueOptions: QueueOptions = {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 24 * 60 * 60 }, // 24 h
        removeOnFail: { age: 7 * 24 * 60 * 60 }, // 7 d
      },
    };
    bulkUploadQueue = new Queue(queueName, queueOptions);
  } else {
    logger.warn('BullMQ Queue not initialized — Redis is unavailable.');
  }
} catch (err: any) {
  logger.warn({ err: err.message }, 'Failed to create BullMQ queue. Bulk upload will be unavailable.');
}

export const createBulkUploadWorker = (concurrency = 2) => {
  if (!redis) {
    logger.warn('Cannot create BullMQ worker — Redis is unavailable.');
    return null;
  }
  const workerOpts: WorkerOptions = {
    connection: redis,
    concurrency,
  };
  return new Worker(queueName, bulkUploadProcessor, workerOpts);
};

export { bulkUploadQueue };
