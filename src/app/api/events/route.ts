import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole, createServerSupabase } from '@/lib/auth-server';

function getPagination(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const skip = (page - 1) * limit;
  return { skip, take: limit };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { skip, take } = getPagination(searchParams);
    
    // Note: Public endpoint, no auth required to GET events
    const supabase = createServerSupabase();

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false })
      .range(skip, skip + take - 1);

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    const mappedEvents = (events || []).map(event => {
      const parts = (event.location || '').split('|');
      return {
        ...event,
        location: parts[0],
        time: parts[1] || '',
      };
    });

    return NextResponse.json(mappedEvents);

  } catch (error: any) {
    console.error(`Error in GET /api/events:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin', 'committee']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const data = await request.json().catch(() => null);

    if (!data) {
      return NextResponse.json({ error: 'Event data is required.' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const combinedLocation = data.time ? `${data.location || ''}|${data.time}` : data.location;

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        title: data.title,
        description: data.description,
        date: data.date,
        location: combinedLocation,
        is_public: data.isPublic ?? data.is_public ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json({ error: error.message || 'Failed to create event' }, { status: 400 });
    }

    const parts = (event.location || '').split('|');

    // Fetch all active user profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_active', true);

    if (profiles && profiles.length > 0) {
      const notifications = profiles.map(p => ({
        user_id: p.id,
        type: 'event_new',
        title: 'New Event Added',
        message: `A new event "${event.title}" has been scheduled for ${new Date(event.date).toLocaleDateString()}.`,
        link: '/home', // Or link to the events page if one exists
      }));

      // Insert notifications in bulk
      const { error: notifError } = await supabase.from('notifications').insert(notifications);
      if (notifError) {
        console.error('Failed to insert new event notifications:', notifError);
      }
    }

    return NextResponse.json({ ...event, location: parts[0], time: parts[1] || '' }, { status: 201 });

  } catch (error: any) {
    console.error(`Error in POST /api/events:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
