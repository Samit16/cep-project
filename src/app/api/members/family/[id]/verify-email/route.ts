import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase, createServerSupabase } from '@/lib/auth-server';

// POST /api/members/family/[id]/verify-email
// Supports:
//   { email, mode: 'prepare' }  -> Checks if email is already verified by another member
//   { email, mode: 'finalize' } -> Marks the member's email as verified in the members table
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { id: targetMemberId } = await params;
    const { user } = authResult;
    const supabase = createServerSupabase();

    // Verify the target member belongs to the same family
    const { data: targetMember, error: fetchError } = await supabase
      .from('members')
      .select('id, family_id')
      .eq('id', targetMemberId)
      .single();

    if (fetchError || !targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (!user.family_id || targetMember.family_id !== user.family_id) {
      return NextResponse.json({ error: 'You can only edit members in your own family.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.email || typeof body.email !== 'string' || !body.email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const newEmail = body.email.trim().toLowerCase();
    const mode = body.mode || 'prepare';

    if (newEmail.endsWith('@kvonagpur.com')) {
      return NextResponse.json({ error: 'Please provide a real email address.' }, { status: 400 });
    }

    // ── MODE: PREPARE ───────────────────────────────────────────────
    if (mode === 'prepare') {
      // Check if another member has this email address verified
      const { data: conflictMember, error: conflictError } = await supabase
        .from('members')
        .select('id, first_name, last_name')
        .eq('email', newEmail)
        .eq('email_verified', true)
        .neq('id', targetMemberId)
        .maybeSingle();

      if (conflictError) {
        console.error('Error checking conflict member:', conflictError);
        return NextResponse.json({ error: 'Database verification check failed.' }, { status: 500 });
      }

      if (conflictMember) {
        const name = `${conflictMember.first_name || ''} ${conflictMember.last_name || ''}`.trim();
        return NextResponse.json(
          { error: `This email is already linked and verified by another member: ${name}.` },
          { status: 409 }
        );
      }

      return NextResponse.json({ success: true, message: 'No conflicts found. Ready for OTP.' }, { status: 200 });
    }

    // ── MODE: FINALIZE ──────────────────────────────────────────────
    if (mode === 'finalize') {
      const { error: updateError } = await supabase
        .from('members')
        .update({ email: newEmail, email_verified: true })
        .eq('id', targetMemberId);

      if (updateError) {
        console.error('Error updating member verification status:', updateError);
        return NextResponse.json({ error: 'Failed to update email verification status.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, email: newEmail }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid mode.' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error in POST /api/members/family/[id]/verify-email:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
