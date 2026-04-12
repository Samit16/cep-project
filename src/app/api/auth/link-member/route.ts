import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase, createServerSupabase } from '@/lib/auth-server';

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { user } = authResult;
    const body = await request.json().catch(() => null);

    if (!body || !body.member_id) {
      return NextResponse.json({ error: 'member_id is required in the request body.' }, { status: 400 });
    }

    const { member_id } = body as { member_id: string };
    const supabase = createServerSupabase();

    // Verify the member exists
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('id', member_id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Update profile
    const { error } = await supabase
      .from('profiles')
      .update({ member_id, is_first_login: false })
      .eq('id', user.id);

    if (error) {
      console.error('Error linking member:', error);
      return NextResponse.json({ error: 'Failed to link member' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Member linked successfully' });

  } catch (error: any) {
    console.error('Error in /api/auth/link-member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
