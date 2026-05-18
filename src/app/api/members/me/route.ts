import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase, createServerSupabase } from '@/lib/auth-server';
import { sanitizeObject } from '@/lib/sanitize';

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
          email: user.email?.includes('@kvonagpur.com') ? '' : (user.email || ''),
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
        name: `${newMember.first_name || ''} ${newMember.middle_name || ''} ${newMember.last_name || ''}`.replace(/\s+/g, ' ').trim(),
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

    const firstName = member.first_name || '';
    const middleName = member.middle_name || '';
    const lastName = member.last_name || '';

    // Auto-sync email verification status from Supabase Auth
    if (user.email_confirmed_at && !member.email_verified && user.email === member.email) {
      member.email_verified = true;
      await supabase.from('members').update({ email_verified: true }).eq('id', memberId);
    }

    // Remove default email before returning
    if (member.email && member.email.includes('@kvonagpur.com')) {
      member.email = '';
    }

    return NextResponse.json({
      ...member,
      name: `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim(),
    });

  } catch (error: any) {
    console.error('Error in /api/members/me:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { user } = authResult;
    const changes = await request.json().catch(() => null);

    if (!changes || Object.keys(changes).length === 0) {
      return NextResponse.json({ error: 'No update data provided.' }, { status: 400 });
    }

    // Only allow specific fields to be updated
    // Note: the DB uses contact_numbers (TEXT[]), not contact_no.
    // We accept contact_no from the frontend and map it to contact_numbers.
    const allowedFields = ['first_name', 'middle_name', 'last_name', 'occupation', 'marital_status', 'current_place', 'kutch_town', 'contact_numbers', 'email', 'nukh', 'birthplace', 'relations', 'contact_visibility'];
    const updateData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (changes[key] !== undefined) {
        updateData[key] = changes[key];
      }
    }

    // Map contact_no (single string from UI) → contact_numbers (TEXT[] in DB)
    if (changes['contact_no'] !== undefined && changes['contact_no'] !== null) {
      const num = String(changes['contact_no']).trim();
      updateData['contact_numbers'] = num ? [num] : [];
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided.' }, { status: 400 });
    }

    // Auto-sync email verification status from Supabase Auth
    if (user.email_confirmed_at) {
      // If they are explicitly updating the email to match their verified Auth email, set verified to true
      if (updateData['email'] && updateData['email'] === user.email) {
        updateData['email_verified'] = true;
      } else if (!updateData['email']) {
        // Just a regular profile update, sync the flag if it's not present
        updateData['email_verified'] = true;
      }
    }

    // Sanitize all string fields to strip HTML tags (XSS prevention)
    const sanitizedData = sanitizeObject(updateData);

    let memberId = user.member_id;

    if (!memberId) {
      return NextResponse.json({ error: 'No member profile linked to this account.' }, { status: 404 });
    }

    const supabase = createServerSupabase();

    // If user is updating their email, also update it in Supabase Auth
    // and trigger a verification email. This is the KEY step that makes the
    // email system work: saving from Edit Profile updates both the members
    // table AND the auth.users table.
    const newEmail = sanitizedData['email'];
    const currentAuthEmail = user.email || '';
    if (newEmail && newEmail !== currentAuthEmail && !newEmail.includes('@kvonagpur.com')) {
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(user.id, {
        email: newEmail,
        email_confirm: false, // Keep unconfirmed so they must verify via OTP
      });
      if (authUpdateError) {
        console.error('Failed to update auth email:', authUpdateError.message);
        // Do NOT block the member table update — still save the email in members table
        // The mandatory prompt will ask them to verify it on next login
      }
      // Mark as unverified since the auth email just changed
      sanitizedData['email_verified'] = false;
    }

    const { data: updatedMember, error } = await supabase
      .from('members')
      .update(sanitizedData)
      .eq('id', memberId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating member profile:', error);
      return NextResponse.json(
        { error: 'Failed to update profile.', detail: error.message },
        { status: 500 }
      );
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
      await supabase.from('members').update({ profile_complete: true }).eq('id', memberId);
      updatedMember.profile_complete = true;
    }

    const firstName = updatedMember.first_name || '';
    const middleName = updatedMember.middle_name || '';
    const lastName = updatedMember.last_name || '';

    // Strip dummy email before returning to client
    if (updatedMember.email && updatedMember.email.includes('@kvonagpur.com')) {
      updatedMember.email = '';
    }

    return NextResponse.json({
      ...updatedMember,
      name: `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim(),
    });

  } catch (error: unknown) {
    console.error('Error in PUT /api/members/me:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
