import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole, createServerSupabase } from '@/lib/auth-server';
import { sanitizeObject } from '@/lib/sanitize';
import { getPagination } from '@/lib/pagination';

export const dynamic = 'force-dynamic';

// GET /api/admin/members — list members for the admin/committee dashboard
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin', 'committee']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const { skip, take } = getPagination(searchParams);
    const name = searchParams.get('name') || searchParams.get('search');

    const supabase = createServerSupabase();

    let query = supabase
      .from('members')
      .select('id, first_name, middle_name, last_name, email, occupation, current_place, active, profile_complete, created_at, updated_at, contact_numbers, family_id, profiles(role)')
      .order('first_name', { ascending: true })
      .order('last_name', { ascending: true })
      .range(skip, skip + take - 1);

    if (name) {
      const q = name.trim().replace(/[%_(),.]/g, '');
      if (q.length > 0 && q.length <= 100) {
        const parts = q.split(/\s+/);
        if (parts.length > 1) {
          const f = parts[0];
          const l = parts.slice(1).join(' ');
          query = query.or(`and(first_name.ilike.%${f}%,last_name.ilike.%${l}%),middle_name.ilike.%${q}%`);
        } else {
          query = query.or(`first_name.ilike.%${q}%,middle_name.ilike.%${q}%,last_name.ilike.%${q}%`);
        }
      }
    }

    const { data: members, error } = await query;

    if (error) {
      console.error('Error fetching admin members:', error);
      return NextResponse.json(
        { error: 'Failed to fetch members', detail: error.message },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (members || []).map((m: any) => {
      const firstName = m.first_name || '';
      const middleName = m.middle_name || '';
      const lastName = m.last_name || '';
      const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
      const role = m.profiles && m.profiles.length > 0 ? m.profiles[0].role : 'member';
      const memberData = { ...m };
      delete memberData.profiles;
      return {
        ...memberData,
        name: fullName || 'Unknown Member',
        role,
      };
    });

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('Error in GET /api/admin/members:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/admin/members — create a new member (committee/admin only)
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

    // Sanitize input — only fields that exist in the members table
    const sanitized = sanitizeObject(data, [
      'first_name', 'middle_name', 'last_name', 'email',
      'occupation', 'marital_status', 'current_place', 'kutch_town',
    ]);

    // Validate required fields
    const firstName = (sanitized.first_name || '').trim();
    const middleName = (sanitized.middle_name || '').trim();
    const lastName = (sanitized.last_name || '').trim();

    if (!firstName || !middleName || !lastName) {
      return NextResponse.json(
        { error: 'First name, middle name, and surname are required fields.' },
        { status: 400 }
      );
    }

    const memberEmail = sanitized.email && sanitized.email.trim() ? sanitized.email.trim() : null;

    // Prevent duplicates (case-insensitive)
    const { data: duplicate } = await supabase
      .from('members')
      .select('id')
      .ilike('first_name', firstName)
      .ilike('middle_name', middleName)
      .ilike('last_name', lastName)
      .limit(1);

    if (duplicate && duplicate.length > 0) {
      return NextResponse.json(
        { error: `A member named ${firstName} ${middleName} ${lastName} already exists in the directory.` },
        { status: 409 }
      );
    }

    // Compute username BEFORE inserting so it can be returned in the response.
    // Format: firstnamemiddlename_surname (lowercase, a-z0-9 and underscore only)
    const baseUsername = `${firstName}${middleName}_${lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
    const { data: existingProf } = await supabase
      .from('profiles')
      .select('username')
      .ilike('username', baseUsername)
      .maybeSingle();
    const username = existingProf
      ? `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`
      : baseUsername;
    const memberRole = data.role === 'committee' ? 'committee' : 'member';

    // Insert member record — only send columns that actually exist in the table
    const { data: member, error } = await supabase
      .from('members')
      .insert({
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        contact_numbers: data.contact_numbers || [],
        email: memberEmail,
        occupation: sanitized.occupation || null,
        marital_status: sanitized.marital_status || null,
        current_place: sanitized.current_place || null,
        kutch_town: sanitized.kutch_town || null,
        family_members: data.family_members || [],
        is_alive: data.is_alive ?? true,
        active: data.active ?? true,
        contact_visibility: data.contact_visibility || 'public',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating member:', JSON.stringify(error));
      return NextResponse.json(
        { error: error.message || 'Failed to create member', detail: error.message },
        { status: 500 }
      );
    }

    const memberId = member.id;

    // Fire-and-forget: create Supabase auth user + upsert profile in the background.
    // Auth admin API calls are slow (remote network); running them async means the
    // committee member sees the success response instantly.
    (async () => {
      try {
        let authUserId: string | null = null;

        if (memberEmail) {
          // Member provided a real email — use it as the auth identity
          const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
            email: memberEmail,
            password: username,
            email_confirm: true,
            user_metadata: { username, first_name: firstName, last_name: lastName },
          });
          if (authData?.user) authUserId = authData.user.id;
          else if (authErr) console.warn(`Auth (email) failed for ${memberId}:`, authErr.message);
        } else {
          // No real email — use an internal placeholder that is NEVER stored in the
          // members table and NEVER shown to any user
          const internalEmail = `${username}@kvonagpur.com`;
          const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
            email: internalEmail,
            password: username,
            email_confirm: true,
            user_metadata: { username, first_name: firstName, last_name: lastName },
          });
          if (authData?.user) authUserId = authData.user.id;
          else if (authErr) console.warn(`Auth (internal) failed for ${memberId}:`, authErr.message);
        }

        if (authUserId) {
          // Upsert the profile row — handles both DB-trigger-created and non-trigger scenarios
          const { error: upsertErr } = await supabase
            .from('profiles')
            .upsert(
              {
                id: authUserId,
                member_id: memberId,
                role: memberRole,
                username,
                is_first_login: true,
                is_active: true,
              },
              { onConflict: 'id' }
            );
          if (upsertErr) {
            console.warn(`Profile upsert failed for ${memberId}:`, upsertErr.message);
          } else {
            console.log(`✅ Auth + profile ready for member ${memberId} (username: ${username})`);
          }
        }
      } catch (err) {
        console.error(`Auth/profile setup failed for member ${memberId}:`, err);
      }
    })();

    // Return member data + computed username immediately so the dashboard can display credentials
    return NextResponse.json({ ...member, _username: username }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error in POST /api/admin/members:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
