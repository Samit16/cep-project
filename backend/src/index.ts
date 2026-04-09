import Fastify from 'fastify';
import config from './config/env';
import { logger } from './utils/logger';
import authPlugin from './plugins/auth';
import corsPlugin from './plugins/cors';
import csrfPlugin from './plugins/csrf';
import rateLimitPlugin from './plugins/rateLimit';
import multipartPlugin from './plugins/multipart';
import getSupabase from './config/supabase';

import authRoutes from './routes/auth';
import memberRoutes from './routes/members';
import adminRoutes from './routes/admin';
import eventRoutes from './routes/events';



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
    // Initialize Supabase client
    try {
      const supabase = getSupabase();
      logger.info('Supabase client initialized successfully');
    } catch (err) {
      logger.warn({ err }, 'Supabase initialization failed. Supabase features will be unavailable.');
    }



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

    server.decorate('config', config);

    // Register routes (prefixes)
    await server.register(authRoutes, { prefix: '/api/auth' });
    await server.register(memberRoutes, { prefix: '/api/members' });
    await server.register(adminRoutes, { prefix: '/api/admin' });
    await server.register(eventRoutes, { prefix: '/api/events' });

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
