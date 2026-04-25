import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uevmyvwbmxqreyukbvkq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldm15dndibXhxcmV5dWtidmtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODgzNTIsImV4cCI6MjA5MTI2NDM1Mn0.cupOcJUL-3rl1sh1bMX3LPkz_Srf0holBrxs3fIRcUo';

export const SUPABASE_PROJECT_ID = 'uevmyvwbmxqreyukbvkq';
export const SUPABASE_STORAGE_KEY = `sb-${SUPABASE_PROJECT_ID}-auth-token`;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    storageKey: SUPABASE_STORAGE_KEY,
    autoRefreshToken: true,
    persistSession: true,
  },
});
