import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase, createServerSupabase } from '@/lib/auth-server';

// GET: Check if the current member has any pending profile-update-request notifications
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { user } = authResult;
    if (!user.member_id) {
      return NextResponse.json({ hasPendingRequest: false });
    }

    const supabase = createServerSupabase();

    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('id, created_at, payload')
      .eq('member_id', user.member_id)
      .eq('action', 'profile-update-request')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking notifications:', error);
      return NextResponse.json({ hasPendingRequest: false });
    }

    // Check if there's a pending (not dismissed) request
    const pendingRequest = logs?.find(
      (log: any) => log.payload?.status === 'pending'
    );

    return NextResponse.json({
      hasPendingRequest: !!pendingRequest,
      notification: pendingRequest || null,
    });

  } catch (error: any) {
    console.error('Error in /api/members/me/notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Dismiss the notification
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { user } = authResult;
    const body = await request.json().catch(() => null);
    const notificationId = body?.notificationId;

    if (!notificationId) {
      return NextResponse.json({ error: 'Missing notificationId' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Update the payload status to 'dismissed'
    const { data: existing, error: fetchError } = await supabase
      .from('audit_logs')
      .select('payload')
      .eq('id', notificationId)
      .eq('member_id', user.member_id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('audit_logs')
      .update({
        payload: { ...existing.payload, status: 'dismissed' },
      })
      .eq('id', notificationId);

    if (error) {
      console.error('Error dismissing notification:', error);
      return NextResponse.json({ error: 'Failed to dismiss notification' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Notification dismissed' });

  } catch (error: any) {
    console.error('Error in PUT /api/members/me/notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
