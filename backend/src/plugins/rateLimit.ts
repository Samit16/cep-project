import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  try {
    // Use in-memory store
    const rateOpts: any = {
      max: 100,
      timeWindow: '1 minute',
      keyGenerator: (request: any) => request.ip,
      continueExceeding: true,
      skipOnError: true,
    };

    await fastify.register(require('@fastify/rate-limit'), rateOpts);
  } catch (err) {
    fastify.log.error({ err }, 'Failed to register rate-limit plugin, proceeding without it');
  }
};

export default fp(rateLimitPlugin, { name: 'rateLimitPlugin' });
