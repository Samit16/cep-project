import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from './env';
import { logger } from '../utils/logger';

let supabase: SupabaseClient;

export const getSupabase = (): SupabaseClient => {
  if (!supabase) {
    if (!config.supabaseUrl || !config.supabaseServiceKey) {
      logger.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
      throw new Error('Supabase configuration is incomplete');
    }

    supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    logger.info('Supabase client initialized');
  }

  return supabase;
};

export default getSupabase;
