import IORedis from 'ioredis';
import config from './env';
import { logger } from '../utils/logger';

const redis = new IORedis({
  host: config.redisHost,
  port: config.redisPort,
  password: config.redisPassword,
  tls: config.redisHost.includes('upstash.io') ? {} : undefined,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
});

redis.on('error', (err: any) => {
  logger.warn({ err }, 'Redis connection failed. Features like OTP and Rate Limiting will be disabled.');
});

export default redis;
