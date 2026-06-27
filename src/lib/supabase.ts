import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(' Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
}

const projectId = supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1] || 'missing-project-id';

export const SUPABASE_PROJECT_ID = projectId;
export const SUPABASE_STORAGE_KEY = `sb-${projectId}-auth-token`;

// Migration: Copy session from sessionStorage to localStorage
if (typeof window !== 'undefined') {
  const oldKey = `sb-${projectId}-auth-token`;
  const session = window.sessionStorage.getItem(oldKey);
  if (session && !window.localStorage.getItem(SUPABASE_STORAGE_KEY)) {
    window.localStorage.setItem(SUPABASE_STORAGE_KEY, session);
    window.sessionStorage.removeItem(oldKey);
  }
}

const validUrl = supabaseUrl.startsWith('http') ? supabaseUrl : 'https://missing.supabase.co';
const validKey = supabaseAnonKey || 'missing-key';

export const supabase = createClient(
  validUrl,
  validKey,
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: SUPABASE_STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);
