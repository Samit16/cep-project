import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole, createServerSupabase } from '@/lib/auth-server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authResult = await requireRole(request, 'admin');
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { userId } = await params;
    const body = await request.json().catch(() => null);

    if (!body || !body.role) {
      return NextResponse.json({ error: 'Role is required in the request body.' }, { status: 400 });
    }

    const { role } = body as { role: 'member' | 'committee' | 'admin' };

    if (!['member', 'committee', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be member, committee, or admin.' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    
    // Using service_role key to bypass RLS for admin user updates
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) {
      console.error('Error updating role:', error);
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Role updated successfully' });

  } catch (error: any) {
    console.error('Error in /api/auth/users/[userId]/role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
