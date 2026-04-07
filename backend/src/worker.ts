import { createBulkUploadWorker } from './plugins/redisQueue';
import { logger } from './utils/logger';
import { isRedisAvailable } from './config/redis';

const worker = createBulkUploadWorker(2);

if (!worker) {
  logger.error('Cannot start bulk upload worker — Redis is unavailable. Exiting.');
  process.exit(1);
}

worker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Job failed');
});

process.on('SIGINT', async () => {
  await worker.close();
  process.exit(0);
});

logger.info('Bulk upload worker started');
