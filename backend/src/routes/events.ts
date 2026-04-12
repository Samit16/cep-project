import { FastifyPluginAsync } from 'fastify';
import { getPagination } from '../utils/pagination';
import getSupabase from '../config/supabase';

const eventsRoutes: FastifyPluginAsync = async (fastify) => {
  // Public GET (Supabase)
  fastify.get('/', async (request, reply) => {
    const { skip, take } = getPagination(request.query);
    const supabase = getSupabase();

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false })
      .range(skip, skip + take - 1);

    if (error) {
      return reply.code(500).send({ error: 'Failed to fetch events' });
    }

    // Extract virtual time property from location (stored as "location|time")
    const mappedEvents = (events || []).map(event => {
      const parts = (event.location || '').split('|');
      return {
        ...event,
        location: parts[0],
        time: parts[1] || '',
      };
    });

    reply.send(mappedEvents);
  });

  // Admin creates event (Supabase)
  fastify.post('/', { preValidation: [(fastify as any).requireRole(['admin', 'committee'])] }, async (request, reply) => {
    const data = request.body as any;
    const supabase = getSupabase();

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
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message || 'Failed to create event' });
    }

    // map back for response
    const parts = (event.location || '').split('|');
    reply.code(201).send({ ...event, location: parts[0], time: parts[1] || '' });
  });

  // Admin updates event (Supabase)
  fastify.put('/:id', { preValidation: [(fastify as any).requireRole(['admin', 'committee'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const supabase = getSupabase();

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
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message || 'Failed to update event' });
    }

    const resParts = (event.location || '').split('|');
    reply.send({ ...event, location: resParts[0], time: resParts[1] || '' });
  });

  // Admin deletes event (Supabase)
  fastify.delete('/:id', { preValidation: [(fastify as any).requireRole(['admin', 'committee'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const supabase = getSupabase();

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message || 'Failed to delete event' });
    }

    reply.send({ message: 'Deleted' });
  });
};

export default eventsRoutes;
