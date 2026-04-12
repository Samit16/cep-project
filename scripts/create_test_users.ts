import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTestUser(username: string, password: string, role: 'member' | 'committee') {
  console.log(`Creating test user: ${username} with role: ${role}...`);
  const email = `${username}@kvonagpur.com`;

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username: username,
    }
  });

  if (authError) {
    console.error(`Error creating auth user ${username}:`, authError.message);
    return;
  }

  const userId = authData.user?.id;
  if (!userId) return;

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      role: role,
      is_first_login: false, // Set to false so testing is direct
    });

  if (profileError) {
    console.error(`Error creating profile for ${username}:`, profileError.message);
  } else {
    console.log(`Successfully created ${username} account!`);
  }
}

async function run() {
  await createTestUser('member123', 'member123', 'member');
  await createTestUser('committee123', 'committee123', 'committee');
  console.log('Test user creation finished.');
}

run();
