import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(' Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
}

const projectId = supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1] || 'missing-project-id';

export const SUPABASE_PROJECT_ID = projectId;
export const SUPABASE_STORAGE_KEY = `sb-${projectId}-auth-token`;

// Tab isolation flag: this key in sessionStorage marks that THIS tab has an active login.
// New tabs and new browser sessions start without it, so they appear logged out.
export const TAB_ACTIVE_KEY = 'kjo_tab_active';

const validUrl = supabaseUrl.startsWith('http') ? supabaseUrl : 'https://missing.supabase.co';
const validKey = supabaseAnonKey || 'missing-key';

export const supabase = createClient(
  validUrl,
  validKey,
  {
    auth: {
      // Keep localStorage so the session token survives client-side navigation
      // and works reliably with Next.js middleware cookie checks.
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: SUPABASE_STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);
