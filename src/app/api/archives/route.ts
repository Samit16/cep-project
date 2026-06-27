import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase, requireRole, createServerSupabase } from '@/lib/auth-server';
import { sanitizeObject } from '@/lib/sanitize';

// ============================================================
// GET /api/archives — fetch all posts (any authenticated user)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const supabase = createServerSupabase();

    // Fetch posts and join author info via profiles → members
    const { data: posts, error } = await supabase
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
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching archive posts:', error);
      return NextResponse.json({ error: 'Failed to fetch archive posts' }, { status: 500 });
    }

    // Fetch view counts for all posts in one query (non-fatal if table doesn't exist)
    const postIds = (posts || []).map((p) => p.id);
    let viewCounts: Record<string, number> = {};
    if (postIds.length > 0) {
      try {
        const { data: views } = await supabase
          .from('archive_post_views')
          .select('post_id')
          .in('post_id', postIds);

        // Count per post
        (views || []).forEach((row: { post_id: string }) => {
          viewCounts[row.post_id] = (viewCounts[row.post_id] ?? 0) + 1;
        });
      } catch {
        // archive_post_views table may not exist yet — ignore, view_count defaults to 0
      }
    }

    // Flatten author info into the top-level post object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalized = (posts || []).map((post: any) => {
      const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
      const member = profile?.members
        ? (Array.isArray(profile.members) ? profile.members[0] : profile.members)
        : null;

      return {
        id: post.id,
        author_id: post.author_id,
        content: post.content,
        image_urls: post.image_urls ?? [],
        created_at: post.created_at,
        updated_at: post.updated_at,
        author_name: member
          ? `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim()
          : 'Committee Member',
        author_photo: null,
        view_count: viewCounts[post.id] ?? 0,
      };
    });

    return NextResponse.json(normalized);
  } catch (error: unknown) {
    console.error('Error in GET /api/archives:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ================================================================
// POST /api/archives — create a post (committee + admin only)
// ================================================================
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['committee', 'admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Request body is required.' }, { status: 400 });
    }

    const { content, image_urls } = body as { content?: string; image_urls?: string[] };

    if (!content?.trim() && (!image_urls || image_urls.length === 0)) {
      return NextResponse.json(
        { error: 'A post must have either content or at least one image.' },
        { status: 400 }
      );
    }

    const sanitized = sanitizeObject({ content: content ?? '' }, ['content']);

    const supabase = createServerSupabase();

    const { data: post, error } = await supabase
      .from('archive_posts')
      .insert({
        author_id: authResult.user.id,
        content: sanitized.content ?? '',
        image_urls: Array.isArray(image_urls) ? image_urls : [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating archive post:', error);
      return NextResponse.json({ error: error.message || 'Failed to create post' }, { status: 400 });
    }

    // ── Notify all other authenticated users (fire-and-forget, never blocks the response) ──
    void (async () => {
      try {
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('id')
          .neq('id', authResult.user.id);

        if (allProfiles && allProfiles.length > 0) {
          const preview = (sanitized.content ?? '').slice(0, 80).trim();
          const messageText = preview
            ? `"${preview}${preview.length === 80 ? '\u2026' : ''}"`
            : 'A committee member shared a new archive post.';

          const notificationRows = allProfiles.map((p: { id: string }) => ({
            user_id: p.id,
            type: 'archive_post',
            title: 'New Archive Post',
            message: messageText,
            link: '/archives',
            is_read: false,
          }));

          for (let i = 0; i < notificationRows.length; i += 100) {
            await supabase.from('notifications').insert(notificationRows.slice(i, i + 100));
          }
        }
      } catch (notifErr) {
        console.error('Failed to send archive post notifications:', notifErr);
      }
    })();
    // ─────────────────────────────────────────────────────────────

    return NextResponse.json({ ...post, view_count: 0 }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error in POST /api/archives:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
