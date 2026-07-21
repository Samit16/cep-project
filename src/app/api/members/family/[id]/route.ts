import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase, createServerSupabase } from '@/lib/auth-server';
import { sanitizeObject } from '@/lib/sanitize';

// PUT /api/members/family/[id] — update a specific family member
export async function PUT(
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

    const changes = await request.json().catch(() => null);
    if (!changes || Object.keys(changes).length === 0) {
      return NextResponse.json({ error: 'No update data provided.' }, { status: 400 });
    }

    const allowedFields = ['first_name', 'middle_name', 'last_name', 'occupation', 'marital_status', 'current_place', 'kutch_town', 'contact_numbers', 'email', 'nukh', 'birthplace', 'relations', 'contact_visibility', 'relation', 'whatsapp', 'gender'];
    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (changes[key] !== undefined) {
        updateData[key] = changes[key];
      }
    }

    // Map contact_no → contact_numbers
    if (changes['contact_no'] !== undefined && changes['contact_no'] !== null) {
      const num = String(changes['contact_no']).trim();
      updateData['contact_numbers'] = num ? [num] : [];
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided.' }, { status: 400 });
    }

    const sanitizedData = sanitizeObject(updateData);



    const { data: updatedMember, error } = await supabase
      .from('members')
      .update(sanitizedData)
      .eq('id', targetMemberId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating family member:', error);
      return NextResponse.json({ error: 'Failed to update member.', detail: error.message }, { status: 500 });
    }

    // Check if profile is complete
    const isComplete =
      !!updatedMember.first_name &&
      !!updatedMember.last_name &&
      !!updatedMember.occupation &&
      !!updatedMember.marital_status &&
      !!updatedMember.current_place &&
      !!updatedMember.kutch_town &&
      !!updatedMember.nukh &&
      !!updatedMember.birthplace &&
      (updatedMember.contact_numbers && updatedMember.contact_numbers.length > 0) &&
      !!updatedMember.email;

    if (isComplete && !updatedMember.profile_complete) {
      await supabase.from('members').update({ profile_complete: true }).eq('id', targetMemberId);
      updatedMember.profile_complete = true;
    }

    // Strip dummy email
    if (updatedMember.email?.includes('@kvonagpur.com')) {
      updatedMember.email = '';
    }

    return NextResponse.json({
      ...updatedMember,
      name: `${updatedMember.first_name || ''} ${updatedMember.middle_name || ''} ${updatedMember.last_name || ''}`.replace(/\s+/g, ' ').trim(),
    });

  } catch (error: unknown) {
    console.error('Error in PUT /api/members/family/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/members/family/[id] — get a single family member
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

    if (!user.family_id || member.family_id !== user.family_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      ...member,
      name: `${member.first_name || ''} ${member.middle_name || ''} ${member.last_name || ''}`.replace(/\s+/g, ' ').trim(),
    });
  } catch (error: unknown) {
    console.error('Error in GET /api/members/family/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/members/family/[id] — remove a member from the family
export async function DELETE(
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

    // Prevent deleting yourself
    if (user.member_id === targetMemberId) {
      return NextResponse.json({ error: 'You cannot remove yourself from the family.' }, { status: 400 });
    }

    // Verify the target member belongs to the same family as the requester
    const { data: targetMember, error: fetchError } = await supabase
      .from('members')
      .select('id, family_id, first_name, last_name')
      .eq('id', targetMemberId)
      .single();

    if (fetchError || !targetMember) {
      return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    }

    if (!user.family_id || targetMember.family_id !== user.family_id) {
      return NextResponse.json({ error: 'You can only remove members from your own family.' }, { status: 403 });
    }

    // Check if the target member has an associated profile (linked account)
    // If so, unlink it rather than deleting — the auth account remains but is detached
    const { data: linkedProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('member_id', targetMemberId)
      .maybeSingle();

    if (linkedProfile) {
      // Unlink the profile from this member — member gets detached but auth account stays
      await supabase
        .from('profiles')
        .update({ member_id: null })
        .eq('id', linkedProfile.id);
    }

    // Delete the member record from the database
    const { error: deleteError } = await supabase
      .from('members')
      .delete()
      .eq('id', targetMemberId);

    if (deleteError) {
      console.error('Error deleting family member:', deleteError);
      return NextResponse.json({ error: 'Failed to remove member.', detail: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, removed_id: targetMemberId });

  } catch (error: unknown) {
    console.error('Error in DELETE /api/members/family/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
