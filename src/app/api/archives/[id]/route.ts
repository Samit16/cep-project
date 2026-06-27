import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase, createServerSupabase } from '@/lib/auth-server';
import { sanitizeObject } from '@/lib/sanitize';

// ================================================================
// PUT /api/archives/[id] — edit a post (original author only)
// ================================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: 'Request body is required.' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Verify the current user is the author
    const { data: existing, error: fetchError } = await supabase
      .from('archive_posts')
      .select('author_id, image_urls')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    if (existing.author_id !== authResult.user.id) {
      return NextResponse.json({ error: 'Forbidden: you can only edit your own posts.' }, { status: 403 });
    }

    const { content, image_urls } = body as { content?: string; image_urls?: string[] };
    const sanitized = sanitizeObject({ content: content ?? '' }, ['content']);

    const { data: post, error } = await supabase
      .from('archive_posts')
      .update({
        content: sanitized.content ?? '',
        image_urls: Array.isArray(image_urls) ? image_urls : existing.image_urls ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating archive post:', error);
      return NextResponse.json({ error: error.message || 'Failed to update post' }, { status: 400 });
    }

    return NextResponse.json(post);
  } catch (error: unknown) {
    console.error('Error in PUT /api/archives/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ================================================================
// DELETE /api/archives/[id] — delete a post (original author only)
// ================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { id } = await params;
    const supabase = createServerSupabase();

    // Verify the current user is the author before deleting
    const { data: existing, error: fetchError } = await supabase
      .from('archive_posts')
      .select('author_id, image_urls')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    if (existing.author_id !== authResult.user.id) {
      return NextResponse.json({ error: 'Forbidden: you can only delete your own posts.' }, { status: 403 });
    }

    // Delete post record
    const { error } = await supabase
      .from('archive_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting archive post:', error);
      return NextResponse.json({ error: error.message || 'Failed to delete post' }, { status: 400 });
    }

    // Optionally clean up storage objects (best-effort, non-blocking)
    if (existing.image_urls?.length) {
      const paths = existing.image_urls
        .map((url: string) => {
          try {
            const u = new URL(url);
            // Extract the path after /storage/v1/object/public/archive_images/
            const match = u.pathname.match(/\/archive_images\/(.+)/);
            return match ? match[1] : null;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as string[];

      if (paths.length) {
        supabase.storage.from('archive_images').remove(paths).catch(console.error);
      }
    }

    return NextResponse.json({ message: 'Post deleted.' });
  } catch (error: unknown) {
    console.error('Error in DELETE /api/archives/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
