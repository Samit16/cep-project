import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This is a protected cron route. It should only be called securely.
// We use a simple authorization header check for protection.
// In production, Vercel Cron uses `request.headers.get('Authorization') === `Bearer ${process.env.CRON_SECRET}`
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET || 'development_secret';
    
    // Allow if we are in dev, or if the correct secret is provided
    if (process.env.NODE_ENV !== 'development' && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find events happening tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString();
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString();

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, date')
      .gte('date', startOfTomorrow)
      .lte('date', endOfTomorrow);

    if (eventsError) {
      throw new Error(eventsError.message);
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ message: 'No events tomorrow. Skipping.' });
    }

    // Fetch all active user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_active', true);

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'No active users to notify.' });
    }

    let totalNotificationsSent = 0;

    for (const event of events) {
      const notifications = profiles.map(p => ({
        user_id: p.id,
        type: 'event_reminder',
        title: 'Upcoming Event Reminder',
        message: `Reminder: The event "${event.title}" is happening tomorrow!`,
        link: '/home',
      }));

      const { error: notifError } = await supabase.from('notifications').insert(notifications);
      
      if (notifError) {
        console.error('Failed to insert event reminders:', notifError);
      } else {
        totalNotificationsSent += notifications.length;
      }
    }

    return NextResponse.json({ 
      message: 'Event reminders sent successfully', 
      eventsCount: events.length,
      totalNotificationsSent 
    });

  } catch (error: any) {
    console.error('Error in /api/cron/event-reminders:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
