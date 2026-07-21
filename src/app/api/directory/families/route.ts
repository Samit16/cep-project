import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase, createServerSupabase } from '@/lib/auth-server';
import { getPagination } from '@/lib/pagination';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const { skip, take } = getPagination(searchParams);
    const name = searchParams.get('name') || searchParams.get('search');

    const supabase = createServerSupabase();

    let query = supabase
      .from('members')
      .select('*, families(name)')
      .order('first_name', { ascending: true })
      .order('last_name', { ascending: true });

    // Filter by active status (include true and null, exclude explicitly false)
    query = query.or('active.is.null,active.eq.true');

    if (name) {
      const q = name.trim().replace(/[%_(),.]/g, '');
      if (q.length > 0 && q.length <= 100) {
        // Find matching family IDs first so we fetch the entire family
        const { data: matchingMembers } = await supabase
          .from('members')
          .select('family_id')
          .or(`first_name.ilike.%${q}%,middle_name.ilike.%${q}%,last_name.ilike.%${q}%`)
          .or('active.is.null,active.eq.true');
          
        const matchingFamilyIds = [...new Set((matchingMembers || []).map(m => m.family_id).filter(Boolean))];
        
        if (matchingFamilyIds.length > 0) {
          query = query.in('family_id', matchingFamilyIds);
        } else {
          // Force no results
          query = query.eq('id', '00000000-0000-0000-0000-000000000000');
        }
      }
    }

    // Since we need to group by family_id, we fetch all matching members,
    // group them in memory, and then apply pagination to the grouped results.
    // Note: If the community scales massively, this approach should be migrated 
    // to a Supabase RPC function.
    const { data: members, error } = await query;

    if (error) {
      console.error('Error fetching members for families view:', error);
      return NextResponse.json(
        { error: 'Failed to fetch members', detail: error.message },
        { status: 500 }
      );
    }

    const familyMap = new Map<string, Record<string, unknown>[]>();
    
    (members || []).forEach((m: Record<string, unknown> /* eslint-disable-line @typescript-eslint/no-explicit-any */ | any) => {
      if (m.family_id) {
        if (!familyMap.has(m.family_id)) {
          familyMap.set(m.family_id, []);
        }
        familyMap.get(m.family_id)?.push({
          ...m,
          id: m.id,
          name: `${m.first_name || ''} ${m.middle_name || ''} ${m.last_name || ''}`.replace(/\s+/g, ' ').trim(),
          contact_numbers: m.contact_visibility === 'public' ? (m.contact_numbers || []) : [],
        });
      }
    });

    const families: Array<{ family_id: string, family_name: string, members: Record<string, unknown>[] }> = [];
    familyMap.forEach((familyMembers, family_id) => {
      // Include families (size > 1). For solo members (size === 1), only include them if they have explicitly opted in (contact_visibility === 'public')
      if (familyMembers.length > 1 || (familyMembers.length === 1 && (familyMembers[0] as any).contact_visibility === 'public')) {
        // Determine a family name. Use the families.name if it exists, otherwise fallback to primary member's name.
        let familyName = 'Unknown Family';
        const firstMember = familyMembers[0] as any;
        if (firstMember?.families?.name) {
          familyName = firstMember.families.name;
        } else {
          const primaryMember = familyMembers.find(m => !m.relation) || familyMembers[0];
          familyName = (primaryMember.name as string) || 'Unknown Family';
        }
        
        families.push({
          family_id,
          family_name: familyName,
          members: familyMembers
        });
      }
    });

    // Sort families alphabetically by family_name
    families.sort((a, b) => a.family_name.localeCompare(b.family_name));

    // Apply pagination
    const paginatedFamilies = families.slice(skip, skip + take);

    return NextResponse.json(paginatedFamilies);

  } catch (error: unknown) {
    console.error('Error in /api/directory/families:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', detail: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}
