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

    let profile;
    let autoLinked = false;

    // Fetch profile
    const { data: initialProfile } = await supabase
      .from('profiles')
      .select('id, role, member_id, is_first_login, is_active')
      .eq('id', user.id)
      .single();

    profile = initialProfile;

    // Auto-link logic if member_id is missing
    if (profile && !profile.member_id && user.email) {
      const { data: matchedMember } = await supabase
        .from('members')
        .select('id')
        .ilike('email', user.email)
        .maybeSingle();

      if (matchedMember) {
        profile.member_id = matchedMember.id;
        profile.is_first_login = false;
        autoLinked = true;

        await supabase
          .from('profiles')
          .update({ member_id: matchedMember.id, is_first_login: false })
          .eq('id', user.id);
      }
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch members block explicitly because the original single query via join might be empty if member_id was missing during evaluation
    const { data: memberData } = profile.member_id 
      ? await supabase.from('members').select('id, first_name, last_name, email').eq('id', profile.member_id).single()
      : { data: null };

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: profile.role,
      member_id: profile.member_id,
      is_first_login: profile.is_first_login,
      member: memberData || null,
    });

  } catch (error: any) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
