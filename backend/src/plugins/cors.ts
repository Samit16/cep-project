import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import config from '../config/env';

const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(require('@fastify/cors'), {
    origin: config.frontendUrl,
    credentials: true,
  });
};

export default fp(corsPlugin, { name: 'corsPlugin' });
