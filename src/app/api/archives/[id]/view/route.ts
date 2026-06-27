import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase, createServerSupabase } from '@/lib/auth-server';

// ================================================================
// POST /api/archives/[id]/view — log that the current user viewed this post
// Uses upsert so repeated calls are idempotent (no duplicate counts).
// ================================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    if (!postId) {
      return NextResponse.json({ error: 'Missing post id' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Upsert: do nothing if the row already exists (author viewing their own post is fine to skip)
    const { error } = await supabase
      .from('archive_post_views')
      .upsert(
        { post_id: postId, user_id: authResult.user.id },
        { onConflict: 'post_id,user_id', ignoreDuplicates: true }
      );

    if (error) {
      console.error('Error recording view:', error);
      // Return 200 anyway — a failed view log shouldn't break the UI
      return NextResponse.json({ ok: false, error: error.message });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('Error in POST /api/archives/[id]/view:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
