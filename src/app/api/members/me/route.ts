import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase, createServerSupabase } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { user } = authResult;
    const supabase = createServerSupabase();

    let memberId = user.member_id;

    // Step 1: Try to auto-link by email if member_id is missing
    if (!memberId && user.email) {
      const { data: matchedMember } = await supabase
        .from('members')
        .select('id')
        .ilike('email', user.email)
        .maybeSingle();

      if (matchedMember) {
        memberId = matchedMember.id;
        await supabase
          .from('profiles')
          .update({ member_id: memberId, is_first_login: false })
          .eq('id', user.id);
      }
    }

    // Step 2: If still no member, auto-create one from the user's auth info
    if (!memberId) {
      const emailParts = (user.email || '').replace('@kvonagpur.com', '').split('_');
      const firstName = emailParts[0] || user.email?.split('@')[0] || 'Member';
      const lastName = emailParts.length > 1 ? emailParts.slice(1).join(' ') : '';

      const { data: newMember, error: createError } = await supabase
        .from('members')
        .insert({
          first_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
          last_name: lastName.charAt(0).toUpperCase() + lastName.slice(1),
          email: user.email || '',
          contact_numbers: [],
          active: true,
          contact_visibility: 'private',
        })
        .select()
        .single();

      if (createError || !newMember) {
        console.error('Failed to auto-create member record:', createError);

        // Fallback: return basic profile from auth session instead of crashing
        return NextResponse.json({
          id: user.id,
          name: firstName.charAt(0).toUpperCase() + firstName.slice(1) + (lastName ? ' ' + lastName.charAt(0).toUpperCase() + lastName.slice(1) : ''),
          first_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
          last_name: lastName.charAt(0).toUpperCase() + lastName.slice(1),
          email: user.email || '',
          contact_numbers: [],
          contact_visibility: 'private',
          active: true,
          _fallback: true,
        });
      }

      memberId = newMember.id;

      // Link the new member to the Supabase profile
      await supabase
        .from('profiles')
        .update({ member_id: memberId, is_first_login: false })
        .eq('id', user.id);

      // Return the newly created member directly
      return NextResponse.json({
        ...newMember,
        name: `${newMember.first_name} ${newMember.last_name}`.trim(),
      });
    }

    // Step 3: Fetch the linked member
    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (error || !member) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const firstName = member.first_name || member.NAME || '';
    const lastName = member.last_name || member['LAST NAME'] || '';
    
    return NextResponse.json({
      ...member,
      name: `${firstName} ${lastName}`.trim(),
    });

  } catch (error: any) {
    console.error('Error in /api/members/me:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
