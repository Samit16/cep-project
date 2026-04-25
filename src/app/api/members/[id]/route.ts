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

    const isOwner = user.member_id === member.id;
    const visible = member.contact_visibility === 'public' || isOwner;

    const firstName = member.first_name || '';
    const middleName = member.middle_name || '';
    const lastName = member.last_name || '';

    const response = {
      ...member,
      name: `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim() || 'Unknown Member',
      contact_numbers: visible ? (member.contact_numbers || []) : [],
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error(`Error in /api/members/[id]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
