import { FastifyPluginAsync } from 'fastify';
import { getPagination } from '../utils/pagination';
import getSupabase from '../config/supabase';

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preValidation', (fastify as any).requireRole(['admin', 'committee']));

  // List members (Supabase)
  fastify.get('/members', async (request, reply) => {
    const { skip, take } = getPagination(request.query);
    const { name } = request.query as any;
    const supabase = getSupabase();

    let query = supabase
      .from('members')
      .select('*')
      .range(skip, skip + take - 1);

    if (name) {
      query = query.or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%`);
    }

    const { data: members, error } = await query;

    if (error) {
      return reply.code(500).send({ error: 'Failed to fetch members' });
    }

    const result = (members || []).map((m: any) => {
      const firstName = m.first_name || m.NAME || '';
      const lastName = m.last_name || m['LAST NAME'] || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return {
        ...m,
        name: fullName || 'Unknown Member',
      };
    });

    reply.send(result);
  });

  // Create member (Supabase)
  fastify.post('/members', async (request, reply) => {
    const data = request.body as any;
    const supabase = getSupabase();

    const { data: member, error } = await supabase
      .from('members')
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        address: data.address,
        contact_numbers: data.contact_numbers || [],
        email: data.email,
        occupation: data.occupation,
        marital_status: data.marital_status,
        current_place: data.current_place,
        kutch_town: data.kutch_town,
        family_members: data.family_members || [],
        is_alive: data.is_alive ?? true,
        active: data.active ?? true,
        contact_visibility: data.contact_visibility || 'private',
      })
      .select()
      .single();

    if (error) {
      return reply.code(500).send({ error: 'Failed to create member', details: error.message });
    }

    reply.code(201).send(member);
  });

  // Update member (Supabase)
  fastify.put('/members/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const supabase = getSupabase();

    const { data: member, error } = await supabase
      .from('members')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return reply.code(500).send({ error: 'Failed to update member', details: error.message });
    }

    reply.send(member);
  });

  // Deactivate member (Supabase)
  fastify.patch('/members/:id/deactivate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).supabaseUser;
    const supabase = getSupabase();

    const { data: member, error } = await supabase
      .from('members')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return reply.code(500).send({ error: 'Failed to deactivate member' });
    }

    // Log the deactivation
    await supabase.from('audit_logs').insert({
      user_id: user?.id || null,
      member_id: id,
      action: 'deactivate',
    });

    reply.send(member);
  });

  // Export CSV (Supabase)
  fastify.get('/members/export', async (request, reply) => {
    const supabase = getSupabase();

    const { data: members, error } = await supabase
      .from('members')
      .select('*');

    if (error) {
      return reply.code(500).send({ error: 'Failed to export members' });
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

    reply.header('Content-Type', 'text/csv').send(`${csvHeader}\n${csvRows}`);
  });

  // Audit logs (Supabase)
  fastify.get('/audit-logs', async (request, reply) => {
    const supabase = getSupabase();

    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return reply.code(500).send({ error: 'Failed to fetch audit logs' });
    }

    reply.send(logs);
  });

};

export default adminRoutes;
