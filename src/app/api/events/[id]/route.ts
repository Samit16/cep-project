import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole, createServerSupabase } from '@/lib/auth-server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(request, ['admin', 'committee']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { id } = await params;
    const data = await request.json().catch(() => null);

    if (!data) {
      return NextResponse.json({ error: 'Update data is required.' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const updatePayload: any = { ...data };
    if (data.location !== undefined || data.time !== undefined) {
      const parts = (updatePayload.location || '').split('|');
      const baseLoc = data.location !== undefined ? data.location : parts[0];
      const newTime = data.time !== undefined ? data.time : (parts[1] || '');
      updatePayload.location = newTime ? `${baseLoc}|${newTime}` : baseLoc;
      delete updatePayload.time; // prevent DB failure
    }

    const { data: event, error } = await supabase
      .from('events')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return NextResponse.json({ error: error.message || 'Failed to update event' }, { status: 400 });
    }

    const resParts = (event.location || '').split('|');
    return NextResponse.json({ ...event, location: resParts[0], time: resParts[1] || '' });

  } catch (error: any) {
    console.error(`Error in PUT /api/events/[id]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(request, ['admin', 'committee']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { id } = await params;
    const supabase = createServerSupabase();

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      return NextResponse.json({ error: error.message || 'Failed to delete event' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Deleted' });

  } catch (error: any) {
    console.error(`Error in DELETE /api/events/[id]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
