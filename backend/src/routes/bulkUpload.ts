import { FastifyPluginAsync } from 'fastify';
import { bulkUploadQueue } from '../plugins/redisQueue';

const bulkUploadRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preValidation', (fastify as any).requireRole(['admin', 'committee']));

  // POST upload
  fastify.post('/members/bulk-upload', async (request, reply) => {
    const parts = request.parts();
    for await (const part of parts as any) {
      if (part.file) {
        const tempPath = (part as any).tempFilePath;
        const job = await bulkUploadQueue.add('processCsv', { filePath: tempPath });
        return reply.send({ jobId: job.id });
      }
    }
    reply.code(400).send({ error: 'No file uploaded' });
  });

  // GET status
  fastify.get('/bulk-upload/:jobId/status', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const job = await bulkUploadQueue.getJob(jobId);
    if (!job) return reply.code(404).send({ error: 'Job not found' });
    const progress = await job.getState();
    const data = job.progress as any;
    reply.send({ status: progress, ...data });
  });

  // POST commit
  fastify.post('/bulk-upload/:jobId/commit', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const { dryRun } = request.body as { dryRun?: boolean };
    const job = await bulkUploadQueue.getJob(jobId);
    if (!job) return reply.code(404).send({ error: 'Job not found' });
    await job.updateData({ ...job.data, commit: !dryRun });
    reply.send({ message: 'Commit flag updated' });
  });
};

export default bulkUploadRoutes;
