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

    const { data: members, error } = await supabase
      .from('members')
      .select('*');

    if (error) {
      console.error('Error exporting members:', error);
      return NextResponse.json({ error: 'Failed to export members' }, { status: 500 });
    }

    const csvHeader = ['First Name', 'Last Name', 'Address', 'Contact Numbers', 'Email', 'Occupation', 'Town', 'Status'].join(',');
    const csvRows = (members || [])
      .map((m: any) => [
        `"${m.first_name}"`,
        `"${m.last_name}"`,
        `"${m.address ?? ''}"`,
        `"${(m.contact_numbers || []).join(';')}"`,
        `"${m.email || ''}"`,
        `"${m.occupation ?? ''}"`,
        `"${m.kutch_town ?? ''}"`,
        m.is_alive ?? true ? 'Alive' : 'Deceased',
      ].join(','))
      .join('\n');

    const csvContent = `${csvHeader}\n${csvRows}`;

    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', 'attachment; filename=members_export.csv');

    return new NextResponse(csvContent, {
      status: 200,
      headers,
    });

  } catch (error: any) {
    console.error(`Error in /api/admin/members/export:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
