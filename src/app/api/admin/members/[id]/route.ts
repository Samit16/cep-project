import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole, createServerSupabase } from '@/lib/auth-server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(request, ['admin', 'committee']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { id } = await params;
    const data = await request.json().catch(() => null);

    if (!data) {
      return NextResponse.json({ error: 'Update data is required.' }, { status: 400 });
    }

    const { role, ...memberData } = data;
    const supabase = createServerSupabase();

    // If role is being changed, perform extra validation
    if (role) {
      // 1. Only allow switching between 'member' and 'committee'
      if (role !== 'member' && role !== 'committee') {
        return NextResponse.json(
          { error: 'Invalid role. Only switching between member and committee is allowed.' }, 
          { status: 400 }
        );
      }

      // 2. Fetch target's current role and verify they aren't an admin
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('member_id', id)
        .maybeSingle();
      
      if (!targetProfile) {
        return NextResponse.json(
          { error: 'This member has not registered an account yet. Role cannot be set until they sign up.' }, 
          { status: 404 }
        );
      }

      if (targetProfile.role === 'admin' && authResult.user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden: Committee members cannot modify administrator roles.' }, 
          { status: 403 }
        );
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('member_id', id);
        
      if (profileError) {
        console.error('Error updating member role:', profileError);
        return NextResponse.json({ error: 'Failed to update member role', details: profileError.message }, { status: 500 });
      }
    }

    let member = null;
    if (Object.keys(memberData).length > 0) {
      const { data: updatedMember, error } = await supabase
        .from('members')
        .update(memberData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating member:', error);
        return NextResponse.json({ error: 'Failed to update member', details: error.message }, { status: 500 });
      }
      member = updatedMember;
    }

    return NextResponse.json(member || { success: true, id, role });

  } catch (error: any) {
    console.error(`Error in /api/admin/members/[id]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
