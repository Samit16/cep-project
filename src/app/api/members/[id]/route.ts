import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase, createServerSupabase } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { id } = await params;
    const { user } = authResult;
    const supabase = createServerSupabase();

    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !member) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const isOwner = user.family_id === member.family_id && user.family_id != null;
    const visible = member.contact_visibility === 'public' || isOwner;

    const firstName = member.first_name || '';
    const middleName = member.middle_name || '';
    const lastName = member.last_name || '';

    const response = {
      ...member,
      name: `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim() || 'Unknown Member',
      contact_numbers: visible ? (member.contact_numbers || []) : [],
      email: visible ? member.email : '',
      contact_no: visible ? member.contact_no : '',
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error(`Error in /api/members/[id]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/members/[id] — delete another member that is a verified duplicate of the logged-in user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { id: targetId } = await params;
    const { user } = authResult;
    const supabase = createServerSupabase();

    if (!user.member_id) {
      return NextResponse.json({ error: 'No member profile linked.' }, { status: 400 });
    }
    if (user.member_id === targetId) {
      return NextResponse.json({ error: 'Use DELETE /api/members/me to delete your own profile.' }, { status: 400 });
    }

    // Fetch both members to verify name match (server-side duplicate check)
    const [selfRes, targetRes] = await Promise.all([
      supabase.from('members').select('id, first_name, middle_name').eq('id', user.member_id).single(),
      supabase.from('members').select('id, first_name, middle_name').eq('id', targetId).single(),
    ]);

    const self = selfRes.data;
    const target = targetRes.data;

    if (!self || !target) {
      return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    }

    // Verify first name matches
    const selfFirst = (self.first_name || '').trim().toLowerCase();
    const targetFirst = (target.first_name || '').trim().toLowerCase();
    if (selfFirst !== targetFirst) {
      return NextResponse.json({ error: 'Cannot delete: first names do not match.' }, { status: 403 });
    }

    // Verify middle name matches (partial / first-word logic)
    const selfMiddle = (self.middle_name || '').trim().toLowerCase();
    const targetMiddle = (target.middle_name || '').trim().toLowerCase();
    const selfMiddleFirst = selfMiddle.split(' ')[0];
    const targetMiddleFirst = targetMiddle.split(' ')[0];

    let nameMatch = false;
    if (selfMiddle && targetMiddle) {
      if (selfMiddle === targetMiddle) nameMatch = true;
      else if (selfMiddle.includes(' ') && selfMiddleFirst === targetMiddle) nameMatch = true;
      else if (targetMiddle.includes(' ') && targetMiddleFirst === selfMiddle) nameMatch = true;
    }

    if (!nameMatch) {
      return NextResponse.json({ error: 'Cannot delete: middle names do not match. This member may not be a duplicate.' }, { status: 403 });
    }

    // Unlink any profile linked to the target
    const { data: linkedProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('member_id', targetId)
      .maybeSingle();

    if (linkedProfile) {
      await supabase
        .from('profiles')
        .update({ member_id: null })
        .eq('id', linkedProfile.id);
    }

    // Delete the duplicate member record
    const { error: deleteError } = await supabase
      .from('members')
      .delete()
      .eq('id', targetId);

    if (deleteError) {
      console.error('Error deleting duplicate member:', deleteError);
      return NextResponse.json({ error: 'Failed to delete duplicate.', detail: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted_id: targetId });

  } catch (error: unknown) {
    console.error(`Error in DELETE /api/members/[id]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

