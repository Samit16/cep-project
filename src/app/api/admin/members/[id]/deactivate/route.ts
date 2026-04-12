import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole, createServerSupabase } from '@/lib/auth-server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(request, ['admin', 'committee']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { id } = await params;
    const { user } = authResult;
    const supabase = createServerSupabase();

    const { data: member, error } = await supabase
      .from('members')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deactivating member:', error);
      return NextResponse.json({ error: 'Failed to deactivate member' }, { status: 500 });
    }

    // Log the deactivation
    const auditError = await supabase.from('audit_logs').insert({
      user_id: user?.id || null,
      member_id: id,
      action: 'deactivate',
    });

    if (auditError.error) {
      console.error('Failed to log deactivation audit log:', auditError.error);
    }

    return NextResponse.json(member);

  } catch (error: any) {
    console.error(`Error in /api/admin/members/[id]/deactivate:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
