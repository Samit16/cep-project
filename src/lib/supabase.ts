import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(' Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
}

const projectId = supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1] || 'missing-project-id';

export const SUPABASE_PROJECT_ID = projectId;
export const SUPABASE_STORAGE_KEY = `sb-${projectId}-auth-token`;

export const supabase = createClient(
  supabaseUrl || 'https://missing.supabase.co',
  supabaseAnonKey || 'missing-key',
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
      storageKey: SUPABASE_STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);
