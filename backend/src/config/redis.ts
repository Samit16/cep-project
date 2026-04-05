import IORedis from 'ioredis';
import config from './env';
import { logger } from '../utils/logger';

const redis = new IORedis({
  host: config.redisHost,
  port: config.redisPort,
  password: config.redisPassword || undefined,
  tls: config.redisPassword ? {} : undefined, // Upstash / cloud Redis requires TLS
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  retryStrategy: () => null, // Stop retrying — fail-open mode
});

let redisErrorLogged = false;
redis.on('error', (err: any) => {
  if (!redisErrorLogged) {
    logger.warn({ err }, 'Redis unavailable. OTP and Rate Limiting disabled. Running in fail-open mode.');
    redisErrorLogged = true;
  }
});

export default redis;
