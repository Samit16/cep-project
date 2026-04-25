import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole, createServerSupabase } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin', 'committee']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const supabase = createServerSupabase();

    const { count, error } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching member count:', error);
      return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 });
    }

    return NextResponse.json({ total: count || 0 });
  } catch (error: any) {
    console.error('Error in /api/admin/members/count:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
