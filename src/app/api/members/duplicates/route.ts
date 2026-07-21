import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase, createServerSupabase } from '@/lib/auth-server';

// GET /api/members/duplicates — find members with matching first_name + middle_name
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { user } = authResult;
    if (!user.member_id) {
      return NextResponse.json({ duplicates: [] });
    }

    const supabase = createServerSupabase();

    // Fetch the logged-in user's own member record
    const { data: self } = await supabase
      .from('members')
      .select('id, first_name, middle_name, last_name, family_id')
      .eq('id', user.member_id)
      .single();

    if (!self || !self.first_name) {
      return NextResponse.json({ duplicates: [] });
    }

    const selfFirstName = (self.first_name || '').trim().toLowerCase();
    const selfMiddle = (self.middle_name || '').trim().toLowerCase();
    // First word of self's middle name
    const selfMiddleFirst = selfMiddle.split(' ')[0];

    if (!selfFirstName) {
      return NextResponse.json({ duplicates: [] });
    }

    // Fetch all other members with the same first name (case-insensitive)
    const { data: candidates } = await supabase
      .from('members')
      .select('id, first_name, middle_name, last_name, family_id')
      .ilike('first_name', selfFirstName)
      .neq('id', self.id);

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ duplicates: [] });
    }

    // Filter by middle name match logic:
    // Match if:
    // 1. Both have the same middle name (exact, case-insensitive)
    // 2. Self's first-word of middle == other's full middle (one has two words, other has one)
    // 3. Other's first-word of middle == self's full middle
    const duplicates = candidates.filter((c) => {
      const otherMiddle = (c.middle_name || '').trim().toLowerCase();
      const otherMiddleFirst = otherMiddle.split(' ')[0];

      if (!selfMiddle && !otherMiddle) return false; // Both have no middle name — too broad

      if (selfMiddle && otherMiddle) {
        // Exact match
        if (selfMiddle === otherMiddle) return true;
        // Self has two words, other has one — compare first word of self to other
        if (selfMiddle.includes(' ') && selfMiddleFirst === otherMiddle) return true;
        // Other has two words, self has one — compare first word of other to self
        if (otherMiddle.includes(' ') && otherMiddleFirst === selfMiddle) return true;
      }

      return false;
    });

    const result = duplicates.map((d) => ({
      id: d.id,
      first_name: d.first_name,
      middle_name: d.middle_name,
      last_name: d.last_name,
      family_id: d.family_id,
      name: `${d.first_name || ''} ${d.middle_name || ''} ${d.last_name || ''}`.replace(/\s+/g, ' ').trim(),
      same_family: d.family_id === self.family_id,
    }));

    return NextResponse.json({ duplicates: result });

  } catch (error: unknown) {
    console.error('Error in GET /api/members/duplicates:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
