import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase, createServerSupabase } from '@/lib/auth-server';
import { sanitizeObject } from '@/lib/sanitize';

// GET /api/members/family — list all members in the family (of logged-in user or specified memberId)
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { user } = authResult;
    const searchParams = request.nextUrl.searchParams;
    const queryMemberId = searchParams.get('memberId');

    let familyId = user.family_id;
    const supabase = createServerSupabase();

    if (queryMemberId) {
      const { data: targetMember, error: findError } = await supabase
        .from('members')
        .select('family_id')
        .eq('id', queryMemberId)
        .single();
      
      if (findError || !targetMember) {
        return NextResponse.json({ error: 'Target member not found' }, { status: 404 });
      }
      familyId = targetMember.family_id;
    }

    if (!familyId) {
      return NextResponse.json({ members: [] });
    }

    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching family members:', error);
      return NextResponse.json({ error: 'Failed to fetch family members' }, { status: 500 });
    }

    const isOwnFamily = familyId === user.family_id;

    const result = (members || []).map((m: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
      const isPublic = m.contact_visibility === 'public' || isOwnFamily;
      return {
        ...m,
        name: `${m.first_name || ''} ${m.middle_name || ''} ${m.last_name || ''}`.replace(/\s+/g, ' ').trim(),
        // Strip dummy emails
        email: isPublic ? (m.email?.includes('@kvonagpur.com') ? '' : (m.email || '')) : '',
        contact_no: isPublic ? (m.contact_no || '') : '',
        contact_numbers: isPublic ? (m.contact_numbers || []) : [],
        whatsapp: isPublic ? (m.whatsapp || '') : '',
      };
    });

    return NextResponse.json({ members: result });
  } catch (error: unknown) {
    console.error('Error in GET /api/members/family:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Helper to determine the inverse of a relation relative to self
function determineInverseRelation(relation: string, genderSelf?: string): string {
  const rel = (relation || '').trim().toLowerCase();
  const selfG = (genderSelf || '').trim().toLowerCase();

  switch (rel) {
    case 'spouse':
      return 'spouse';
    case 'son':
    case 'daughter':
      return selfG === 'female' ? 'mother' : 'father';
    case 'father':
    case 'mother':
      return selfG === 'female' ? 'daughter' : 'son';
    case 'brother':
    case 'sister':
      return selfG === 'female' ? 'sister' : 'brother';
    case 'son-in-law':
    case 'daughter-in-law':
      return selfG === 'female' ? 'mother-in-law' : 'father-in-law';
    case 'father-in-law':
    case 'mother-in-law':
      return selfG === 'female' ? 'daughter-in-law' : 'son-in-law';
    case 'grandson':
    case 'granddaughter':
      return selfG === 'female' ? 'grandmother' : 'grandfather';
    case 'grandfather':
    case 'grandmother':
      return selfG === 'female' ? 'granddaughter' : 'grandson';
    default:
      return 'other';
  }
}

// Helper to determine the chained relationship (B to X, then X to A, what is B to A?)
function determineChainedRelation(
  relBtoX: string,
  relXtoA: string,
  genderB?: string
): string {
  const bx = (relBtoX || '').trim().toLowerCase();
  const xa = (relXtoA || '').trim().toLowerCase();
  const gB = (genderB || '').trim().toLowerCase();

  if (!xa || xa === 'self') {
    return bx.charAt(0).toUpperCase() + bx.slice(1);
  }

  // 1. If X is A's Child (Son or Daughter)
  if (xa === 'son' || xa === 'daughter') {
    if (bx === 'spouse') {
      return gB === 'female' ? 'Daughter-in-law' : 'Son-in-law';
    }
    if (bx === 'son' || bx === 'daughter') {
      return gB === 'female' ? 'Granddaughter' : 'Grandson';
    }
    if (bx === 'brother' || bx === 'sister') {
      return gB === 'female' ? 'Daughter' : 'Son';
    }
    if (bx === 'father' || bx === 'mother') {
      return 'Spouse'; // B is also X's parent, so B is A's spouse
    }
  }

  // 2. If X is A's Spouse
  if (xa === 'spouse') {
    if (bx === 'son' || bx === 'daughter') {
      return gB === 'female' ? 'Daughter' : 'Son';
    }
    if (bx === 'father' || bx === 'mother') {
      return gB === 'female' ? 'Mother-in-law' : 'Father-in-law';
    }
    if (bx === 'brother' || bx === 'sister') {
      return gB === 'female' ? 'Sister-in-law' : 'Brother-in-law';
    }
  }

  // 3. If X is A's Parent (Father or Mother)
  if (xa === 'father' || xa === 'mother') {
    if (bx === 'spouse') {
      return gB === 'female' ? 'Mother' : 'Father';
    }
    if (bx === 'son' || bx === 'daughter') {
      return gB === 'female' ? 'Sister' : 'Brother';
    }
  }

  // 4. If X is A's Sibling (Brother or Sister)
  if (xa === 'brother' || xa === 'sister') {
    if (bx === 'brother' || bx === 'sister') {
      return gB === 'female' ? 'Sister' : 'Brother';
    }
    if (bx === 'father' || bx === 'mother') {
      return gB === 'female' ? 'Mother' : 'Father';
    }
    if (bx === 'son' || bx === 'daughter') {
      return gB === 'female' ? 'Niece' : 'Nephew';
    }
  }

  // 5. If X is A's Parent-in-law
  if (xa === 'father-in-law' || xa === 'mother-in-law') {
    if (bx === 'son' || bx === 'daughter') {
      return gB === 'female' ? 'Sister-in-law' : 'Brother-in-law';
    }
  }

  // 6. If X is A's Child-in-law
  if (xa === 'son-in-law' || xa === 'daughter-in-law') {
    if (bx === 'brother' || bx === 'sister') {
      return gB === 'female' ? 'Sister-in-law' : 'Brother-in-law';
    }
    if (bx === 'son' || bx === 'daughter') {
      return gB === 'female' ? 'Granddaughter' : 'Grandson';
    }
  }

  if (bx) {
    return bx.charAt(0).toUpperCase() + bx.slice(1);
  }
  return 'Family Member';
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

    const allowedFields = ['first_name', 'middle_name', 'last_name', 'occupation', 'marital_status', 'current_place', 'kutch_town', 'nukh', 'birthplace', 'email', 'contact_numbers', 'contact_visibility', 'relation', 'gender'];
    const insertData: Record<string, unknown> = {
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

    // 1. Search if a member already exists with the same phone or email
    let searchPhone = '';
    if (body['contact_no'] !== undefined && body['contact_no'] !== null) {
      searchPhone = String(body['contact_no']).trim();
    }
    const searchEmail = body['email'] ? String(body['email']).trim() : '';

    let existingMember = null;

    if (searchEmail && !searchEmail.includes('@kvonagpur.com')) {
      const { data } = await supabase
        .from('members')
        .select('*')
        .ilike('email', searchEmail)
        .maybeSingle();
      if (data) existingMember = data;
    }

    if (!existingMember && searchPhone) {
      const { data } = await supabase
        .from('members')
        .select('*')
        .contains('contact_numbers', [searchPhone])
        .maybeSingle();
      if (data) existingMember = data;
    }

    if (!existingMember && body.first_name && body.last_name) {
      const { data } = await supabase
        .from('members')
        .select('*')
        .ilike('first_name', body.first_name)
        .ilike('last_name', body.last_name)
        .limit(1);
      if (data && data.length > 0) existingMember = data[0];
    }

    if (existingMember) {
      const existingFamilyId = existingMember.family_id;
      const userFamilyId = user.family_id;

      if (existingFamilyId === userFamilyId) {
        // Already in the same family. Just update their details.
        const { data: updated, error: updateErr } = await supabase
          .from('members')
          .update(sanitizedData)
          .eq('id', existingMember.id)
          .select('*')
          .single();

        if (updateErr) {
          console.error('Error updating existing member in same family:', updateErr);
          return NextResponse.json({ error: 'Failed to update existing family member.' }, { status: 500 });
        }

        return NextResponse.json({
          ...updated,
          name: `${updated.first_name || ''} ${updated.middle_name || ''} ${updated.last_name || ''}`.replace(/\s+/g, ' ').trim(),
        });
      } else {
        // Different families. Merge families.
        // Fetch all members of existingMember's family
        const { data: familyMembersEx, error: fetchExErr } = await supabase
          .from('members')
          .select('*')
          .eq('family_id', existingFamilyId);

        if (fetchExErr || !familyMembersEx || familyMembersEx.length === 0) {
          console.error('Error fetching existing family members:', fetchExErr);
          return NextResponse.json({ error: 'Failed to fetch target family for merge.' }, { status: 500 });
        }

        // Fetch all members of user's family
        const { data: familyMembersUser, error: fetchUserErr } = await supabase
          .from('members')
          .select('*')
          .eq('family_id', userFamilyId);

        if (fetchUserErr || !familyMembersUser || familyMembersUser.length === 0) {
          console.error('Error fetching user family members:', fetchUserErr);
          return NextResponse.json({ error: 'Failed to fetch source family for merge.' }, { status: 500 });
        }

        // Find B (current logged in user's member record)
        const memberB = familyMembersUser.find((m: { id: string, relation?: string, gender?: string }) => m.id === user.member_id) || familyMembersUser.find((m: { id: string, relation?: string, gender?: string }) => !m.relation) || familyMembersUser[0];

        // Calculate B's new relation relative to A
        const inputRelation = (body.relation || '').trim().toLowerCase();
        const relBtoX = determineInverseRelation(inputRelation, memberB.gender);
        const relBtoA = determineChainedRelation(relBtoX, existingMember.relation || '', memberB.gender);

        const updates = [
          {
            id: memberB.id,
            family_id: existingFamilyId,
            relation: relBtoA,
          }
        ];

        // Recalculate other members in user's family relative to A
        for (const m of familyMembersUser) {
          if (m.id === memberB.id) continue;
          const relMtoB = (m.relation || '').trim().toLowerCase();
          const relMtoA = determineChainedRelation(relMtoB, relBtoA, m.gender);
          updates.push({
            id: m.id,
            family_id: existingFamilyId,
            relation: relMtoA,
          });
        }

        // Apply family updates
        for (const up of updates) {
          await supabase
            .from('members')
            .update({ family_id: up.family_id, relation: up.relation })
            .eq('id', up.id);
        }

        // Update existing member Y (existingMember) with any new details from body, keeping family_id and relation intact
        const updateFields = { ...sanitizedData };
        delete updateFields.family_id;
        delete updateFields.relation;
        const { data: updatedX } = await supabase
          .from('members')
          .update(updateFields)
          .eq('id', existingMember.id)
          .select('*')
          .single();

        // Delete the empty family
        await supabase
          .from('families')
          .delete()
          .eq('id', userFamilyId);

        const finalMember = updatedX || existingMember;
        return NextResponse.json({
          ...finalMember,
          name: `${finalMember.first_name || ''} ${finalMember.middle_name || ''} ${finalMember.last_name || ''}`.replace(/\s+/g, ' ').trim(),
          _merged: true,
        });
      }
    }

    // Normal insertion if no match found
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
  } catch (error: unknown) {
    console.error('Error in POST /api/members/family:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
