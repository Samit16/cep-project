import mongoose from 'mongoose';
import config from './env';
import { logger } from '../utils/logger';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.databaseUrl || 'mongodb://localhost:27017/kjo_samaj', {
      family: 4, // PROD: Force IPv4 for Atlas Free Tier
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error({ err }, 'Failed to connect to MongoDB');
    process.exit(1);
  }
};

export default mongoose;
