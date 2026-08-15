import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole, createServerSupabase } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin', 'committee']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name') || searchParams.get('search');

    const supabase = createServerSupabase();

    // Select only essential fields for member directory (excluding heavy family_members JSON)
    let membersQuery = supabase
      .from('members')
      .select('id, first_name, middle_name, last_name, email, occupation, current_place, active, profile_complete, created_at, updated_at, contact_numbers, family_id, profiles(role)')
      .eq('active', true)
      .order('first_name', { ascending: true })
      .order('last_name', { ascending: true })
      .limit(5000);

    if (name) {
      const q = name.trim().replace(/[%_(),.]/g, '');
      if (q.length > 0 && q.length <= 100) {
        const parts = q.split(/\s+/);
        if (parts.length > 1) {
          const f = parts[0];
          const l = parts.slice(1).join(' ');
          membersQuery = membersQuery.or(`and(first_name.ilike.%${f}%,last_name.ilike.%${l}%),middle_name.ilike.%${q}%`);
        } else {
          membersQuery = membersQuery.or(`first_name.ilike.%${q}%,middle_name.ilike.%${q}%,last_name.ilike.%${q}%`);
        }
      }
    }

    // Execute queries in parallel — also fetch inactive (pending approval) members
    const [countRes, membersRes, eventsRes, pendingRes] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('active', true),
      membersQuery,
      supabase.from('events').select('*').order('date', { ascending: false }).limit(200),
      supabase
        .from('members')
        .select('id, first_name, middle_name, last_name, email, occupation, current_place, active, created_at, contact_numbers, family_id, relation')
        .eq('active', false)
        .order('created_at', { ascending: false }),
    ]);

    if (membersRes.error) {
      console.error('Error fetching dashboard members:', membersRes.error);
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }

    const mapMember = (m: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const firstName = m.first_name || '';
      const middleName = m.middle_name || '';
      const lastName = m.last_name || '';
      const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
      const role = m.profiles && m.profiles.length > 0 ? m.profiles[0].role : 'member';
      const memberData = { ...m };
      delete memberData.profiles;
      return { ...memberData, name: fullName || 'Unknown Member', role };
    };

    const members = (membersRes.data || []).map(mapMember);

    const pendingMembers = (pendingRes.data || []).map((m: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const firstName = m.first_name || '';
      const middleName = m.middle_name || '';
      const lastName = m.last_name || '';
      const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
      return { ...m, name: fullName || 'Unknown Member' };
    });

    const events = (eventsRes.data || []).map((event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const parts = (event.location || '').split('|');
      return {
        ...event,
        location: parts[0],
        time: parts[1] || '',
      };
    });

    return NextResponse.json({
      totalMemberCount: countRes.count || 0,
      members,
      events,
      pendingMembers,
    });
  } catch (error: unknown) {
    console.error('Error in GET /api/admin/dashboard:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
