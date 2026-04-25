import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole, createServerSupabase } from '@/lib/auth-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(request, ['admin', 'committee']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 403 });
    }

    const { id: targetMemberId } = await params;
    const { user } = authResult;
    const supabase = createServerSupabase();

    // Verify target member exists
    const { data: targetMember, error: memberError } = await supabase
      .from('members')
      .select('id, first_name, middle_name, last_name')
      .eq('id', targetMemberId)
      .single();

    if (memberError || !targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Record the request in audit_logs
    const { error } = await supabase.from('audit_logs').insert({
      user_id: user.id,
      member_id: targetMemberId,
      action: 'profile-update-request',
      payload: {
        requested_by_user_id: user.id,
        requested_by_email: user.email,
        target_member_id: targetMemberId,
        status: 'pending',
      },
    });

    if (error) {
      console.error('Error creating profile update request:', error);
      return NextResponse.json({ error: 'Failed to create update request.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Update request sent successfully' });

  } catch (error: any) {
    console.error(`Error in /api/members/[id]/request-update:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
