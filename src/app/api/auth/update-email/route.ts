import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerSupabase, authenticateSupabase } from '@/lib/auth-server';

/**
 * POST /api/auth/update-email
 *
 * Two modes:
 *   { email, mode: 'prepare' }  — Cleans up conflicts so updateUser() can succeed
 *   { email, mode: 'finalize' } — Updates the members table after OTP verification
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.email || typeof body.email !== 'string' || !body.email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const newEmail = body.email.trim().toLowerCase();
    const userId = authResult.user.id;
    const mode = body.mode || 'prepare';

    if (newEmail.endsWith('@kvonagpur.com')) {
      return NextResponse.json({ error: 'Please provide a real email address.' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // ── MODE: FINALIZE ──────────────────────────────────────────────
    // After OTP verification, just update the members table
    if (mode === 'finalize') {
      if (authResult.user.member_id) {
        await supabase
          .from('members')
          .update({ email: newEmail })
          .eq('id', authResult.user.member_id);
      }
      return NextResponse.json({ success: true, email: newEmail }, { status: 200 });
    }

    // ── MODE: PREPARE ───────────────────────────────────────────────
    // Clean up conflicts so the client-side updateUser() can succeed

    // 1. Try to clear pending email change on current user (if RPC exists)
    try {
      await supabase.rpc('clear_pending_email_change', { target_user_id: userId });
    } catch {
      // Ignore if function doesn't exist
    }

    // 2. Search for conflicting auth users who hold this email
    let conflictingUserId: string | null = null;
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 5) {
      const { data: usersPage, error: listError } = await supabase.auth.admin.listUsers({
        page,
        perPage: 1000,
      });

      if (listError) break;

      const conflict = usersPage?.users?.find(
        (u) =>
          (u.email?.toLowerCase() === newEmail || u.new_email?.toLowerCase() === newEmail) &&
          u.id !== userId
      );

      if (conflict) {
        conflictingUserId = conflict.id;
        break;
      }

      hasMore = (usersPage?.users?.length ?? 0) === 1000;
      page++;
    }

    // 3. Resolve conflict
    if (conflictingUserId) {
      const { data: conflictProfile } = await supabase
        .from('profiles')
        .select('id, member_id')
        .eq('id', conflictingUserId)
        .single();

      if (conflictProfile?.member_id) {
        // Same member → merge (delete old auth account)
        if (conflictProfile.member_id === authResult.user.member_id) {
          console.log(`Deleting duplicate auth account ${conflictingUserId} for same member`);
        } else {
          return NextResponse.json(
            { error: 'This email is already linked to another member account. Please use a different email.' },
            { status: 409 }
          );
        }
      } else {
        console.log(`Deleting orphaned auth user ${conflictingUserId}`);
      }

      await supabase.auth.admin.deleteUser(conflictingUserId);
    }

    // 4. Also clear the new_email field on the current user if it's set
    //    This ensures updateUser() doesn't fail with "same email" errors
    const { data: currentUser } = await supabase.auth.admin.getUserById(userId);
    if (currentUser?.user?.email?.toLowerCase() === newEmail) {
      // Email is already set on this user — just confirm it and finalize
      await supabase.auth.admin.updateUserById(userId, { email_confirm: true });
      if (authResult.user.member_id) {
        await supabase.from('members').update({ email: newEmail }).eq('id', authResult.user.member_id);
      }
      return NextResponse.json({ success: true, email: newEmail, alreadySet: true }, { status: 200 });
    }

    return NextResponse.json({ success: true, message: 'Conflicts cleared. Ready for updateUser.' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in /api/auth/update-email:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
