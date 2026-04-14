import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase, createServerSupabase } from '@/lib/auth-server';

function getPagination(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const skip = (page - 1) * limit;
  return { skip, take: limit };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const { skip, take } = getPagination(searchParams);
    
    const name = searchParams.get('name');
    const city = searchParams.get('city');
    const occupation = searchParams.get('occupation');

    const supabase = createServerSupabase();

    let query = supabase
      .from('members')
      .select('*')
      .eq('active', true)
      .range(skip, skip + take - 1);

    if (name) {
      query = query.or(`NAME.ilike.%${name}%,"LAST NAME".ilike.%${name}%`);
    }
    if (city) {
      query = query.eq('current_place', city);
    }
    if (occupation) {
      query = query.eq('occupation', occupation);
    }

    const { data: members, error } = await query;

    if (error) {
      console.error('Error fetching members:', error);
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }

    const result = (members || []).map((m: any) => {
      const isPublic = m.contact_visibility === 'public';
      const firstName = m.first_name || m.NAME || '';
      const lastName = m.last_name || m['LAST NAME'] || '';
      return {
        ...m,
        id: m.id,
        name: `${firstName} ${lastName}`.trim(),
        address: m.address || m.ADDRESS || '',
        contact_numbers: isPublic ? (m.contact_numbers || []) : [],
      };
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in /api/members:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
