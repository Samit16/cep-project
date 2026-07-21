import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase } from '@/lib/auth-server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// POST /api/members/me/show-in-directory
// Allows a solo member (no family yet) to create a solo-family so they appear in the directory.
// Also works for members already in a family (updates the family name).
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { user } = authResult;
    if (!user.member_id) {
      return NextResponse.json({ error: 'No member profile linked.' }, { status: 400 });
    }

    // Use service-role client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch this member's data to build the family name
    const { data: memberData } = await supabaseAdmin
      .from('members')
      .select('id, first_name, middle_name, last_name, family_id')
      .eq('id', user.member_id)
      .single();

    if (!memberData) {
      return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    }

    const memberName = `${memberData.first_name || ''} ${memberData.middle_name || ''} ${memberData.last_name || ''}`.replace(/\s+/g, ' ').trim();
    const familyName = `${memberName} Family`;
    let familyId = memberData.family_id;

    if (!familyId) {
      // Create a new family record
      const { data: newFamily, error: familyError } = await supabaseAdmin
        .from('families')
        .insert({ name: familyName })
        .select('id')
        .single();

      if (familyError || !newFamily) {
        console.error('Failed to create family:', familyError);
        return NextResponse.json({ error: 'Failed to create family record.' }, { status: 500 });
      }

      familyId = newFamily.id;

      // Assign this member to the new family
      const { error: memberUpdateError } = await supabaseAdmin
        .from('members')
        .update({ family_id: familyId })
        .eq('id', user.member_id);

      if (memberUpdateError) {
        console.error('Failed to assign family to member:', memberUpdateError);
        return NextResponse.json({ error: 'Failed to link member to family.' }, { status: 500 });
      }
    } else {
      // Family exists — just update the name
      await supabaseAdmin
        .from('families')
        .upsert({ id: familyId, name: familyName });
    }

    return NextResponse.json({ success: true, family_id: familyId, family_name: familyName });

  } catch (error: unknown) {
    console.error('Error in POST /api/members/me/show-in-directory:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
