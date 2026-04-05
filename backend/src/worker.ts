import { createBulkUploadWorker } from './plugins/redisQueue';
import { logger } from './utils/logger';

const worker = createBulkUploadWorker(2);

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
