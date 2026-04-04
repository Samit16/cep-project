import Fastify from 'fastify';
import config from './config/env';
import redis from './config/redis';
import { logger } from './utils/logger';
import authPlugin from './plugins/auth';
import corsPlugin from './plugins/cors';
import csrfPlugin from './plugins/csrf';
import rateLimitPlugin from './plugins/rateLimit';
import multipartPlugin from './plugins/multipart';
import { connectDB } from './config/db';
import Member from './models/Member';
import Admin from './models/Admin';
import Event from './models/Event';
import AuditLog from './models/AuditLog';
import CsvImportError from './models/CsvImportError';

import { bulkUploadQueue } from './plugins/redisQueue';
import authRoutes from './routes/auth';
import memberRoutes from './routes/members';
import adminRoutes from './routes/admin';
import eventRoutes from './routes/events';
import bulkUploadRoutes from './routes/bulkUpload';

const models = { Member, Admin, Event, AuditLog, CsvImportError };

const server = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  },
});

const start = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Register plugins
    try {
      await server.register(corsPlugin);
      await server.register(csrfPlugin);
      await server.register(rateLimitPlugin);
      await server.register(multipartPlugin);
      await server.register(authPlugin);
    } catch (pluginErr) {
      logger.warn({ err: pluginErr }, 'Some plugins failed to load. Continuing in manual test mode...');
    }

    // Decorate Fastify instance with shared objects
    server.decorate('models', models);
    server.decorate('redis', redis);
    server.decorate('config', config);

    // Register routes (prefixes)
    await server.register(authRoutes, { prefix: '/api/auth' });
    await server.register(memberRoutes, { prefix: '/api/members' });
    await server.register(adminRoutes, { prefix: '/api/admin' });
    await server.register(eventRoutes, { prefix: '/api/events' });
    await server.register(bulkUploadRoutes, { prefix: '/api/admin' });

    const addr = await server.listen({ port: 3001, host: '0.0.0.0' });
    logger.info(`Server listening on ${addr}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  try {
    await server.close();
    await bulkUploadQueue.close();
    await redis.quit();
    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (e) {
    logger.error({ err: e }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
