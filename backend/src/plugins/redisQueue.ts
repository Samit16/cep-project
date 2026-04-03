import { Queue, Worker, QueueOptions, WorkerOptions } from 'bullmq';
import redis from '../config/redis';
import { bulkUploadProcessor } from '../services/bulkUploadService';

const queueName = 'bulkUploadQueue';

const queueOptions: QueueOptions = {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 24 * 60 * 60 }, // 24 h
    removeOnFail: { age: 7 * 24 * 60 * 60 }, // 7 d
  },
};

export const bulkUploadQueue = new Queue(queueName, queueOptions);

// Worker is started in worker.ts; export for type safety
export const createBulkUploadWorker = (concurrency = 2) => {
  const workerOpts: WorkerOptions = {
    connection: redis,
    concurrency,
  };
  return new Worker(queueName, bulkUploadProcessor, workerOpts);
};
