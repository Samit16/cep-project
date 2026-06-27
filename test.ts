import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing DB...');
  const { data, error } = await supabase
    .from('archive_posts')
    .select(`
      id,
      author_id,
      content,
      image_urls,
      created_at,
      updated_at,
      profiles:author_id (
        member_id,
        members:member_id (
          first_name,
          last_name
        )
      )
    `);
  if (error) {
    console.error('Error fetching archive_posts:', error);
  } else {
    console.log('Archive posts:', JSON.stringify(data, null, 2));
  }
}

test();
