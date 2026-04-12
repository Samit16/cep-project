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
    const changes = await request.json().catch(() => null);

    if (!changes) {
      return NextResponse.json({ error: 'No update data provided.' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { error } = await supabase.from('audit_logs').insert({
      user_id: user.id,
      member_id: user.member_id,
      action: 'update-request',
      payload: changes,
    });

    if (error) {
      console.error('Error creating update request audit log:', error);
      return NextResponse.json({ error: 'Failed to record update request.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Update request recorded' });

  } catch (error: any) {
    console.error('Error in /api/members/me/update-request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
