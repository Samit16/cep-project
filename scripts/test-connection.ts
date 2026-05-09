import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

function maskString(str: string | undefined): string {
  if (!str) return 'undefined';
  if (str.length <= 8) return '***';
  return `${str.substring(0, 4)}...${str.substring(str.length - 4)}`;
}

async function run() {
  console.log('=== Database Connection Test ===\n');

  // 1. Check for env files in workspace root
  const envFiles = ['.env.local', '.env', '.env.development', '.env.production'];
  let loadedEnvFile = null;

  for (const envFile of envFiles) {
    const filePath = path.resolve(process.cwd(), envFile);
    if (fs.existsSync(filePath)) {
      console.log(`[✔] Found env file: ${envFile}`);
      try {
        const envConfig = dotenv.parse(fs.readFileSync(filePath));
        for (const k in envConfig) {
          process.env[k] = envConfig[k];
        }
        loadedEnvFile = envFile;
        console.log(`[✔] Successfully loaded variables from ${envFile}`);
      } catch (err: any) {
        console.error(`[❌] Error parsing ${envFile}:`, err.message);
      }
    } else {
      console.log(`[ ] Did not find env file: ${envFile}`);
    }
  }

  console.log('\n=== Checking Environment Variables ===');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log(`NEXT_PUBLIC_SUPABASE_URL:      ${supabaseUrl ? supabaseUrl : '[❌ MISSING]'}`);
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY:  ${maskString(supabaseAnonKey)}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY:      ${maskString(supabaseServiceRoleKey)}`);

  if (!supabaseUrl) {
    console.error('\n[❌] Critical Error: NEXT_PUBLIC_SUPABASE_URL is not configured.');
    process.exit(1);
  }

  if (!supabaseAnonKey && !supabaseServiceRoleKey) {
    console.error('\n[❌] Critical Error: Neither NEXT_PUBLIC_SUPABASE_ANON_KEY nor SUPABASE_SERVICE_ROLE_KEY is configured.');
    process.exit(1);
  }

  const keyToUse = supabaseServiceRoleKey || supabaseAnonKey!;
  const keyType = supabaseServiceRoleKey ? 'Service Role Key' : 'Anon Key';

  console.log(`\nUsing key: ${keyType}`);
  console.log('Connecting to Supabase...');

  try {
    const supabase = createClient(supabaseUrl, keyToUse, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Attempt a simple query on a known table (e.g., profiles)
    console.log('Testing query on table "profiles"...');
    const { data: profiles, error: profilesError, count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    if (profilesError) {
      console.error('[❌] Query to "profiles" table failed with error:', profilesError);
      
      // Attempt alternative query on "events" table
      console.log('Testing query on table "events"...');
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .limit(1);

      if (eventsError) {
        throw new Error(`Failed queries on both tables. Profiles error: ${profilesError.message}. Events error: ${eventsError.message}`);
      } else {
        console.log('[✔] Query to "events" table succeeded!');
      }
    } else {
      console.log(`[✔] Connection successful! "profiles" table contains ${count ?? 0} records.`);
    }

    console.log('\n[🎉] Database connection is working perfectly!');

  } catch (err: any) {
    console.error('\n[❌] Connection failed!');
    console.error('Error Details:', err.message || err);
    process.exit(1);
  }
}

run();
