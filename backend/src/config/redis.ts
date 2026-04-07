import IORedis from 'ioredis';
import config from './env';
import { logger } from '../utils/logger';

let redis: IORedis | null = null;
let redisReady = false;

try {
  const client = new IORedis({
    host: config.redisHost,
    port: config.redisPort,
    password: config.redisPassword,
    tls: config.redisHost.includes('upstash.io') ? {} : undefined,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    retryStrategy(times: number) {
      if (times > 3) {
        logger.warn('Redis retry limit reached. Running without Redis.');
        return null; // Stop retrying
      }
      return Math.min(times * 500, 2000);
    },
    connectTimeout: 5000,
    lazyConnect: true,
  });

  client.on('ready', () => {
    redisReady = true;
    logger.info('Redis connected successfully.');
  });

  client.on('error', (err: any) => {
    redisReady = false;
    logger.warn({ err: err.message }, 'Redis connection error. OTP, Rate Limiting, and Bulk Upload features will be unavailable.');
  });

  client.on('close', () => {
    redisReady = false;
  });

  // Attempt connection but don't block startup
  client.connect().catch(() => {
    logger.warn('Redis initial connection failed. Server will run without Redis features.');
  });

  redis = client;
} catch (err: any) {
  logger.warn({ err: err.message }, 'Failed to create Redis client. Running without Redis.');
}

export const isRedisAvailable = (): boolean => redisReady && redis !== null;
export default redis;
