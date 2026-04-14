import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole, createServerSupabase } from '@/lib/auth-server';

function getPagination(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const skip = (page - 1) * limit;
  return { skip, take: limit };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin', 'committee']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const { skip, take } = getPagination(searchParams);
    const name = searchParams.get('name');

    const supabase = createServerSupabase();

    let query = supabase
      .from('members')
      .select('*')
      .range(skip, skip + take - 1);

    if (name) {
      // Broaden search to include legacy column names (NAME, LAST NAME) if they exist
      query = query.or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%,NAME.ilike.%${name}%,"LAST NAME".ilike.%${name}%`);
    }

    const { data: members, error } = await query;

    if (error) {
      console.error('Error fetching admin members:', error);
      return NextResponse.json(
        { error: 'Failed to fetch members', detail: error.message },
        { status: 500 }
      );
    }

    const result = (members || []).map((m: any) => {
      const firstName = m.first_name || m.NAME || '';
      const lastName = m.last_name || m['LAST NAME'] || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return {
        ...m,
        name: fullName || 'Unknown Member',
      };
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in GET /api/admin/members:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', detail: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin', 'committee']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const data = await request.json().catch(() => null);
    if (!data) {
      return NextResponse.json({ error: 'Data is required.' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { data: member, error } = await supabase
      .from('members')
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        address: data.address,
        contact_numbers: data.contact_numbers || [],
        email: data.email,
        occupation: data.occupation,
        marital_status: data.marital_status,
        current_place: data.current_place,
        kutch_town: data.kutch_town,
        family_members: data.family_members || [],
        is_alive: data.is_alive ?? true,
        active: data.active ?? true,
        contact_visibility: data.contact_visibility || 'private',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating member:', error);
      return NextResponse.json({ error: 'Failed to create member', details: error.message }, { status: 500 });
    }

    return NextResponse.json(member, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/admin/members:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
