import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase, createServerSupabase } from '@/lib/auth-server';

// Canonical relation groups for easier matching
const PARENT_RELS = ['father', 'mother', 'stepfather', 'stepmother', 'adoptive father', 'adoptive mother'];
const CHILD_RELS = ['son', 'daughter', 'stepson', 'stepdaughter', 'adopted son', 'adopted daughter'];
const SIBLING_RELS = ['brother', 'sister', 'half brother', 'half sister', 'stepbrother', 'stepsister', 'adopted sibling'];
const SPOUSE_RELS = ['spouse', 'husband', 'wife'];
const GRANDPARENT_RELS = ['paternal grandfather', 'paternal grandmother', 'maternal grandfather', 'maternal grandmother', 'great grandfather', 'great grandmother', 'step grandfather', 'step grandmother'];
const GRANDCHILD_RELS = ['grandson', 'granddaughter', 'great grandson', 'great granddaughter'];
const UNCLE_AUNT_RELS = ['uncle', 'aunt', 'paternal uncle', 'paternal aunt', 'maternal uncle', 'maternal aunt', 'great uncle', 'great aunt'];
const NEPHEW_NIECE_RELS = ['nephew', 'niece', 'great nephew', 'great niece'];
const IN_LAW_PARENT_RELS = ['father-in-law', 'mother-in-law'];
const IN_LAW_CHILD_RELS = ['son-in-law', 'daughter-in-law', 'grandson-in-law', 'granddaughter-in-law'];
const IN_LAW_SIBLING_RELS = ['brother-in-law', 'sister-in-law'];
const COUSIN_RELS = ['cousin', 'first cousin', 'second cousin', 'cousin once removed', 'step cousin'];

function sibling(gB: string) { return gB === 'female' ? 'Sister' : 'Brother'; }
function parent(gB: string) { return gB === 'female' ? 'Mother' : 'Father'; }
function child(gB: string) { return gB === 'female' ? 'Daughter' : 'Son'; }
function grandparent(gB: string, paternal = false) { 
  const side = paternal ? 'Paternal ' : '';
  return gB === 'female' ? `${side}Grandmother` : `${side}Grandfather`; 
}
function grandchild(gB: string) { return gB === 'female' ? 'Granddaughter' : 'Grandson'; }
function unclAunt(gB: string) { return gB === 'female' ? 'Aunt' : 'Uncle'; }
function nephNiece(gB: string) { return gB === 'female' ? 'Niece' : 'Nephew'; }
function inlawParent(gB: string) { return gB === 'female' ? 'Mother-in-law' : 'Father-in-law'; }
function inlawChild(gB: string) { return gB === 'female' ? 'Daughter-in-law' : 'Son-in-law'; }
function inlawSibling(gB: string) { return gB === 'female' ? 'Sister-in-law' : 'Brother-in-law'; }
function spouseStr(gB: string) { return gB === 'female' ? 'Wife' : 'Husband'; }

// Helper to determine the inverse of a relation relative to self
function determineInverseRelation(relation: string, genderSelf?: string): string {
  const rel = (relation || '').trim().toLowerCase();
  const selfG = (genderSelf || '').trim().toLowerCase();

  if (SPOUSE_RELS.includes(rel)) return spouseStr(selfG);
  if (CHILD_RELS.includes(rel)) return parent(selfG);
  if (PARENT_RELS.includes(rel)) return child(selfG);
  if (SIBLING_RELS.includes(rel)) return sibling(selfG);
  if (IN_LAW_CHILD_RELS.includes(rel)) return inlawParent(selfG);
  if (IN_LAW_PARENT_RELS.includes(rel)) return inlawChild(selfG);
  if (IN_LAW_SIBLING_RELS.includes(rel)) return inlawSibling(selfG);
  if (GRANDPARENT_RELS.includes(rel)) return grandchild(selfG);
  if (GRANDCHILD_RELS.includes(rel)) return grandparent(selfG);
  if (UNCLE_AUNT_RELS.includes(rel)) return nephNiece(selfG);
  if (NEPHEW_NIECE_RELS.includes(rel)) return unclAunt(selfG);
  if (COUSIN_RELS.includes(rel)) return 'Cousin';

  return 'other';
}

// Helper to determine the chained relationship (B to X, then X is A's what, what is B to A?)
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

  // --- X is A's PARENT ---
  if (PARENT_RELS.includes(xa)) {
    if (SPOUSE_RELS.includes(bx)) return parent(gB);
    if (CHILD_RELS.includes(bx)) return sibling(gB);
    if (SIBLING_RELS.includes(bx)) return inlawSibling(gB);
    if (UNCLE_AUNT_RELS.includes(bx)) return inlawSibling(gB);
    if (GRANDPARENT_RELS.includes(bx)) return grandparent(gB);
    if (COUSIN_RELS.includes(bx)) return 'Cousin';
    if (NEPHEW_NIECE_RELS.includes(bx)) return 'Cousin';
  }

  // --- X is A's CHILD ---
  if (CHILD_RELS.includes(xa)) {
    if (SPOUSE_RELS.includes(bx)) return inlawChild(gB);
    if (CHILD_RELS.includes(bx)) return grandchild(gB);
    if (SIBLING_RELS.includes(bx)) return child(gB);
    if (PARENT_RELS.includes(bx)) return spouseStr(gB);
  }

  // --- X is A's SPOUSE ---
  if (SPOUSE_RELS.includes(xa)) {
    if (CHILD_RELS.includes(bx)) return child(gB);
    if (PARENT_RELS.includes(bx)) return inlawParent(gB);
    if (SIBLING_RELS.includes(bx)) return inlawSibling(gB);
    if (UNCLE_AUNT_RELS.includes(bx)) return inlawSibling(gB);
    if (NEPHEW_NIECE_RELS.includes(bx)) return inlawSibling(gB);
  }

  // --- X is A's SIBLING ---
  if (SIBLING_RELS.includes(xa)) {
    if (SIBLING_RELS.includes(bx)) return sibling(gB);
    if (PARENT_RELS.includes(bx)) return parent(gB);
    if (CHILD_RELS.includes(bx)) return nephNiece(gB);
    if (SPOUSE_RELS.includes(bx)) return inlawSibling(gB);
    if (COUSIN_RELS.includes(bx)) return 'Cousin';
  }

  // --- X is A's GRANDPARENT ---
  if (GRANDPARENT_RELS.includes(xa)) {
    if (CHILD_RELS.includes(bx) || PARENT_RELS.includes(bx)) return parent(gB);
    if (GRANDCHILD_RELS.includes(bx)) return grandparent(gB);
    if (SIBLING_RELS.includes(bx)) return 'Great Uncle / Great Aunt';
    if (SPOUSE_RELS.includes(bx)) return grandparent(gB);
  }

  // --- X is A's GRANDCHILD ---
  if (GRANDCHILD_RELS.includes(xa)) {
    if (PARENT_RELS.includes(bx)) return grandparent(gB);
    if (CHILD_RELS.includes(bx)) return 'Great Grandparent';
    if (SIBLING_RELS.includes(bx)) return grandchild(gB);
  }

  // --- X is A's PARENT-IN-LAW ---
  if (IN_LAW_PARENT_RELS.includes(xa)) {
    if (CHILD_RELS.includes(bx)) return inlawSibling(gB);
    if (SPOUSE_RELS.includes(bx)) return inlawChild(gB);
    if (SIBLING_RELS.includes(bx)) return inlawSibling(gB);
  }

  // --- X is A's CHILD-IN-LAW ---
  if (IN_LAW_CHILD_RELS.includes(xa)) {
    if (SIBLING_RELS.includes(bx)) return inlawSibling(gB);
    if (CHILD_RELS.includes(bx)) return grandchild(gB);
    if (PARENT_RELS.includes(bx)) return inlawParent(gB);
  }

  // --- X is A's SIBLING-IN-LAW ---
  if (IN_LAW_SIBLING_RELS.includes(xa)) {
    if (SPOUSE_RELS.includes(bx)) return inlawSibling(gB);
    if (SIBLING_RELS.includes(bx)) return inlawSibling(gB);
    if (PARENT_RELS.includes(bx)) return inlawParent(gB);
    if (CHILD_RELS.includes(bx)) return nephNiece(gB);
  }

  // --- X is A's UNCLE/AUNT ---
  if (UNCLE_AUNT_RELS.includes(xa)) {
    if (PARENT_RELS.includes(bx)) return 'Great Grandparent';
    if (CHILD_RELS.includes(bx)) return 'First Cousin';
    if (SIBLING_RELS.includes(bx)) return unclAunt(gB);
    if (SPOUSE_RELS.includes(bx)) return unclAunt(gB);
  }

  // --- X is A's NEPHEW/NIECE ---
  if (NEPHEW_NIECE_RELS.includes(xa)) {
    if (PARENT_RELS.includes(bx)) return sibling(gB);
    if (SIBLING_RELS.includes(bx)) return parent(gB);
    if (CHILD_RELS.includes(bx)) return nephNiece(gB);
  }

  // --- X is A's COUSIN ---
  if (COUSIN_RELS.includes(xa)) {
    if (PARENT_RELS.includes(bx)) return unclAunt(gB);
    if (SIBLING_RELS.includes(bx)) return 'Cousin';
    if (CHILD_RELS.includes(bx)) return 'Cousin Once Removed';
  }

  if (bx) return bx.charAt(0).toUpperCase() + bx.slice(1);
  return 'Family Member';
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }
    const user = authResult.user;

    if (!user?.member_id || !user?.family_id) {
      return NextResponse.json({ error: 'User does not have an associated profile/family.' }, { status: 400 });
    }

    const body = await request.json();
    const targetMemberId = body.member_id;
    const inputRelation = (body.relation || '').trim().toLowerCase();

    if (!targetMemberId) {
      return NextResponse.json({ error: 'Target member_id is required.' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Fetch existing member
    const { data: existingMember, error: exError } = await supabase
      .from('members')
      .select('*')
      .eq('id', targetMemberId)
      .single();

    if (exError || !existingMember) {
      return NextResponse.json({ error: 'Target member not found.' }, { status: 404 });
    }

    const existingFamilyId = existingMember.family_id;
    const userFamilyId = user.family_id;

    if (existingFamilyId === userFamilyId) {
      return NextResponse.json({
        ...existingMember,
        name: `${existingMember.first_name || ''} ${existingMember.middle_name || ''} ${existingMember.last_name || ''}`.replace(/\s+/g, ' ').trim(),
      });
    }

    // Merge families (move target family into user's family)
    const { data: familyMembersTarget, error: fetchTargetErr } = await supabase
      .from('members')
      .select('*')
      .eq('family_id', existingFamilyId);

    if (fetchTargetErr || !familyMembersTarget || familyMembersTarget.length === 0) {
      return NextResponse.json({ error: 'Failed to fetch target family for merge.' }, { status: 500 });
    }

    const targetMember = existingMember;

    // The user's primary member (or the logged in user)
    const { data: familyMembersUser } = await supabase
      .from('members')
      .select('*')
      .eq('family_id', userFamilyId);
      
    const userMember = familyMembersUser?.find((m: any) => m.id === user.member_id) || familyMembersUser?.find((m: any) => !m.relation) || familyMembersUser?.[0];

    if (!userMember) {
      return NextResponse.json({ error: 'Failed to find user member record.' }, { status: 500 });
    }

    const relTargetToUser = inputRelation; // Target is [inputRelation] of User

    const updates = [
      {
        id: targetMember.id,
        family_id: userFamilyId,
        relation: relTargetToUser,
      }
    ];

    for (const m of familyMembersTarget) {
      if (m.id === targetMember.id) continue;
      const relMToTarget = (m.relation || '').trim().toLowerCase();
      // Relation of M to User = relation of M to Target + relation of Target to User
      const relMToUser = determineChainedRelation(relMToTarget, relTargetToUser, m.gender);
      updates.push({
        id: m.id,
        family_id: userFamilyId,
        relation: relMToUser,
      });
    }

    for (const up of updates) {
      await supabase
        .from('members')
        .update({ family_id: up.family_id, relation: up.relation })
        .eq('id', up.id);
    }

    await supabase.from('families').delete().eq('id', existingFamilyId);

    const { data: finalMember } = await supabase.from('members').select('*').eq('id', targetMemberId).single();

    return NextResponse.json({
      ...(finalMember || existingMember),
      name: `${(finalMember || existingMember).first_name || ''} ${(finalMember || existingMember).middle_name || ''} ${(finalMember || existingMember).last_name || ''}`.replace(/\s+/g, ' ').trim(),
      _merged: true,
    });
  } catch (error: unknown) {
    console.error('Error in POST /api/members/family/link:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
