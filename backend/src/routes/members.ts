import { FastifyPluginAsync } from 'fastify';
import { getPagination } from '../utils/pagination';
import { decryptField, encryptField } from '../plugins/encryption';
import getSupabase from '../config/supabase';

const memberRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preValidation', (fastify as any).authenticateSupabase);

  // GET paginated list with search filters (Supabase)
  fastify.get('/', async (request, reply) => {
    const { skip, take } = getPagination(request.query);
    const { name, city, occupation } = request.query as any;
    const supabase = getSupabase();

    let query = supabase
      .from('members')
      .select('*')
      .eq('active', true)
      .range(skip, skip + take - 1);

    if (name) {
      query = query.or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%,NAME.ilike.%${name}%,"LAST NAME".ilike.%${name}%`);
    }
    if (city) {
      query = query.eq('current_place', city);
    }
    if (occupation) {
      query = query.eq('occupation', occupation);
    }

    const { data: members, error } = await query;

    if (error) {
      return reply.code(500).send({ error: 'Failed to fetch members' });
    }

    const result = (members || []).map((m: any) => {
      const isPublic = m.contact_visibility === 'public';
      const firstName = m.first_name || m.NAME || '';
      const lastName = m.last_name || m['LAST NAME'] || '';
      return {
        ...m,
        id: m.id,
        name: `${firstName} ${lastName}`.trim(),
        address: m.address || m.ADDRESS || '',
        contact_numbers: isPublic ? (m.contact_numbers || []) : [],
      };
    });

    reply.send(result);
  });

  // GET by ID (Supabase)
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).supabaseUser;
    const supabase = getSupabase();

    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !member) {
      return reply.code(404).send({ error: 'Not found' });
    }

    const isOwner = user.member_id === member.id;
    const visible = member.contact_visibility === 'public' || isOwner;

    const response = {
      ...member,
      contact_numbers: visible ? (member.contact_numbers || []) : [],
    };

    reply.send(response);
  });

  // GET /me (Supabase) - get current user's member profile
  fastify.get('/me', async (request, reply) => {
    const user = (request as any).supabaseUser;

    if (!user.member_id) {
      return reply.code(404).send({ error: 'No member profile linked to your account' });
    }

    const supabase = getSupabase();
    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', user.member_id)
      .single();

    if (error || !member) {
      return reply.code(404).send({ error: 'Not found' });
    }

    reply.send(member);
  });

  // PUT /me/update-request (Supabase)
  fastify.put('/me/update-request', async (request, reply) => {
    const user = (request as any).supabaseUser;
    const changes = request.body;
    const supabase = getSupabase();

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      member_id: user.member_id,
      action: 'update-request',
      payload: changes,
    });

    reply.send({ message: 'Update request recorded' });
  });
};

export default memberRoutes;
