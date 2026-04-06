import dotenv from 'dotenv';

dotenv.config();

interface Config {
  jwtSecret: string;
  aesKey: string; // base64 encoded
  redisHost: string;
  redisPort: number;
  redisPassword?: string;
  frontendUrl: string;
  csvBatchSize: number;
  databaseUrl: string;
  port: number;
}

const config: Config = {
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  aesKey: process.env.AES_256_KEY || '',
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  redisPassword: process.env.REDIS_PASSWORD || undefined,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  csvBatchSize: parseInt(process.env.CSV_BATCH_SIZE || '100', 10),
  databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/kjo_samaj',
  port: parseInt(process.env.PORT || '3001', 10),
};

export default config;
