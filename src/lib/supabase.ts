import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const SUPABASE_PROJECT_ID = supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1] || 'uevmyvwbmxqreyukbvkq';
export const SUPABASE_STORAGE_KEY = `sb-${SUPABASE_PROJECT_ID}-auth-token`;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    storageKey: SUPABASE_STORAGE_KEY,
    autoRefreshToken: true,
    persistSession: true,
  },
});
