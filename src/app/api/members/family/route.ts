import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase, createServerSupabase } from '@/lib/auth-server';
import { sanitizeObject } from '@/lib/sanitize';

// GET /api/members/family — list all members in the logged-in user's family
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { user } = authResult;
    if (!user.family_id) {
      return NextResponse.json({ members: [] });
    }

    const supabase = createServerSupabase();
    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .eq('family_id', user.family_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching family members:', error);
      return NextResponse.json({ error: 'Failed to fetch family members' }, { status: 500 });
    }

    const result = (members || []).map((m: any) => ({
      ...m,
      name: `${m.first_name || ''} ${m.middle_name || ''} ${m.last_name || ''}`.replace(/\s+/g, ' ').trim(),
      // Strip dummy emails
      email: m.email?.includes('@kvonagpur.com') ? '' : (m.email || ''),
    }));

    return NextResponse.json({ members: result });
  } catch (error: any) {
    console.error('Error in GET /api/members/family:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/members/family — add a new member to the logged-in user's family
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { user } = authResult;
    if (!user.family_id) {
      return NextResponse.json({ error: 'You are not linked to a family yet.' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.first_name) {
      return NextResponse.json({ error: 'first_name is required.' }, { status: 400 });
    }

    const allowedFields = ['first_name', 'middle_name', 'last_name', 'occupation', 'marital_status', 'current_place', 'kutch_town', 'nukh', 'birthplace', 'email', 'contact_numbers', 'contact_visibility', 'relation'];
    const insertData: Record<string, any> = {
      family_id: user.family_id,
      active: true,
      contact_visibility: 'private',
    };
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        insertData[key] = body[key];
      }
    }

    // Map contact_no (single string from UI) → contact_numbers (TEXT[] in DB)
    if (body['contact_no'] !== undefined && body['contact_no'] !== null) {
      const num = String(body['contact_no']).trim();
      insertData['contact_numbers'] = num ? [num] : [];
    }

    const sanitizedData = sanitizeObject(insertData);

    const supabase = createServerSupabase();
    const { data: newMember, error } = await supabase
      .from('members')
      .insert(sanitizedData)
      .select('*')
      .single();

    if (error) {
      console.error('Error adding family member:', error);
      return NextResponse.json({ error: 'Failed to add family member.', detail: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ...newMember,
      name: `${newMember.first_name || ''} ${newMember.middle_name || ''} ${newMember.last_name || ''}`.replace(/\s+/g, ' ').trim(),
    });
  } catch (error: any) {
    console.error('Error in POST /api/members/family:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
