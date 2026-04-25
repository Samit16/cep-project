import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load .env.local explicitly since we're running out-of-bounds of Next.js
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use service role to bypass email confirmation

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing Supabase credentials in .env.local!");
  process.exit(1);
}

// In v2, we must use createClient with the service role key to act as admin
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function run() {
  console.log('Fetching members...');
  
  // 1. Fetch all members
  const { data: members, error: me } = await supabase
    .from('members')
    .select('*');

  if (me) {
    console.error('Failed to fetch members:', me);
    return;
  }

  // 2. Fetch existing profiles to see who already has an account
  const { data: profiles, error: pe } = await supabase
    .from('profiles')
    .select('member_id, id');

  if (pe) {
    console.error('Failed to fetch profiles:', pe);
    return;
  }

  const linkedMemberIds = new Set(profiles?.map(p => p.member_id).filter(Boolean));

  let createdCount = 0;

  for (const member of members || []) {
    if (linkedMemberIds.has(member.id)) {
      continue; // Skip, already linked
    }

    const firstName = (member.first_name || '').trim();
    const lastName = (member.last_name || '').trim();

    
    if (!firstName || !lastName) {
      console.log(`Skipping member ${member.id} due to missing name parts.`);
      continue;
    }

    // Generate credentials
    const cleanFirstName = firstName.toLowerCase().replace(/\s+/g, '');
    const cleanLastName = lastName.toLowerCase().replace(/\s+/g, '');
    const username = `${cleanFirstName}_${cleanLastName}`;
    const email = `${username}@kvonagpur.com`; // Needed internally for Supabase auth
    const password = `${cleanFirstName}_123`; // Note: Supabase requires min 6 chars by default

    // Fallback if password is < 6 chars
    const safePassword = password.length < 6 ? password + "456" : password;

    try {
      // 3. Create auth user bypassing constraints
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: safePassword,
        email_confirm: true,
        user_metadata: {
          username: username,
          first_name: firstName,
          last_name: lastName,
        }
      });

      if (authError) {
        console.error(`Failed to register ${username}:`, authError.message);
        continue;
      }

      if (!authData.user) continue;

      const newUserId = authData.user.id;

      // 4. Create or update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: newUserId,
          member_id: member.id,
          role: 'member', // Default role
          is_first_login: true,
        });

      if (profileError) {
        console.error(`Failed to link profile for ${username}:`, profileError.message);
      } else {
        console.log(`Created user: ${username} (Pass: ${safePassword})`);
        createdCount++;
      }
    } catch (err) {
      console.error(`Unexpected error processing ${member.id}:`, err);
    }
  }

  console.log(`\nFinished! Created ${createdCount} new user accounts.`);
}

run();
