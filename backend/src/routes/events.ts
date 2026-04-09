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

    reply.send(events);
  });

  // Admin creates event (Supabase)
  fastify.post('/', { preValidation: [(fastify as any).requireRole('admin')] }, async (request, reply) => {
    const data = request.body as any;
    const supabase = getSupabase();

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        title: data.title,
        description: data.description,
        date: data.date,
        location: data.location,
        is_public: data.isPublic ?? data.is_public ?? true,
      })
      .select()
      .single();

    if (error) {
      return reply.code(500).send({ error: 'Failed to create event', details: error.message });
    }

    reply.code(201).send(event);
  });

  // Admin updates event (Supabase)
  fastify.put('/:id', { preValidation: [(fastify as any).requireRole('admin')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const supabase = getSupabase();

    const { data: event, error } = await supabase
      .from('events')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return reply.code(500).send({ error: 'Failed to update event', details: error.message });
    }

    reply.send(event);
  });

  // Admin deletes event (Supabase)
  fastify.delete('/:id', { preValidation: [(fastify as any).requireRole('admin')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const supabase = getSupabase();

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      return reply.code(500).send({ error: 'Failed to delete event' });
    }

    reply.send({ message: 'Deleted' });
  });
};

export default eventsRoutes;
