import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase } from '@/lib/auth-server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { id } = await params;

    const { memberName } = await request.json();
    if (!memberName) {
      return NextResponse.json({ error: 'memberName is required' }, { status: 400 });
    }

    // Use service role to update the families table, bypassing RLS if necessary
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from('families')
      .upsert({ id: id, name: memberName })

    if (error) {
      console.error('Error updating family name:', error);
      return NextResponse.json({ error: 'Failed to update family primary name' }, { status: 500 });
    }

    return NextResponse.json({ success: true, name: memberName });
  } catch (error) {
    console.error('Error in /api/members/family/[id]/set-primary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
