import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import redis from '../config/redis';

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  try {
    await fastify.register(require('@fastify/rate-limit'), {
      max: 100,
      timeWindow: '1 minute',
      keyGenerator: (request: any) => request.ip,
      redis: fastify.redis,
      continueExceeding: true,
      skipOnError: true,
    });
  } catch (err) {
    fastify.log.error({ err }, 'Failed to register rate-limit plugin, proceeding without it');
  }
};

export default fp(rateLimitPlugin, { name: 'rateLimitPlugin' });
