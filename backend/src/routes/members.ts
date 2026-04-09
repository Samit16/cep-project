import { FastifyPluginAsync } from 'fastify';
import { getPagination } from '../utils/pagination';
import { decryptField, encryptField } from '../plugins/encryption';
import getSupabase from '../config/supabase';

const memberRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preValidation', (fastify as any).authenticate);

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

  // *** /me MUST be registered BEFORE /:id to avoid "me" being treated as a UUID ***

  // GET /me (Supabase) - get current user's member profile
  fastify.get('/me', async (request, reply) => {
    const user = (request as any).supabaseUser;
    const supabase = getSupabase();

    let memberId = user.member_id;

    // Step 1: Try to auto-link by email if member_id is missing
    if (!memberId && user.email) {
      const { data: matchedMember } = await supabase
        .from('members')
        .select('id')
        .ilike('email', user.email)
        .maybeSingle();

      if (matchedMember) {
        memberId = matchedMember.id;
        await supabase
          .from('profiles')
          .update({ member_id: memberId, is_first_login: false })
          .eq('id', user.id);
      }
    }

    // Step 2: If still no member, auto-create one from the user's auth info
    if (!memberId) {
      const emailParts = (user.email || '').replace('@kvonagpur.com', '').split('_');
      const firstName = emailParts[0] || user.email?.split('@')[0] || 'Member';
      const lastName = emailParts.length > 1 ? emailParts.slice(1).join(' ') : '';

      const { data: newMember, error: createError } = await supabase
        .from('members')
        .insert({
          first_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
          last_name: lastName.charAt(0).toUpperCase() + lastName.slice(1),
          email: user.email || '',
          contact_numbers: [],
          active: true,
          contact_visibility: 'private',
        })
        .select()
        .single();

      if (createError || !newMember) {
        // Log the actual error for debugging
        fastify.log.error({ err: createError }, 'Failed to auto-create member record');

        // Fallback: return basic profile from auth session instead of crashing
        return reply.send({
          id: user.id,
          name: firstName.charAt(0).toUpperCase() + firstName.slice(1) + (lastName ? ' ' + lastName.charAt(0).toUpperCase() + lastName.slice(1) : ''),
          first_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
          last_name: lastName.charAt(0).toUpperCase() + lastName.slice(1),
          email: user.email || '',
          contact_numbers: [],
          contact_visibility: 'private',
          active: true,
          _fallback: true,
        });
      }

      memberId = newMember.id;

      // Link the new member to the Supabase profile
      await supabase
        .from('profiles')
        .update({ member_id: memberId, is_first_login: false })
        .eq('id', user.id);

      // Return the newly created member directly
      reply.send({
        ...newMember,
        name: `${newMember.first_name} ${newMember.last_name}`.trim(),
      });
      return;
    }

    // Step 3: Fetch the linked member
    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (error || !member) {
      return reply.code(404).send({ error: 'Not found' });
    }

    const firstName = member.first_name || member.NAME || '';
    const lastName = member.last_name || member['LAST NAME'] || '';
    reply.send({
      ...member,
      name: `${firstName} ${lastName}`.trim(),
    });
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

  // GET by ID (Supabase) — registered AFTER /me so "me" isn't treated as :id
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

    const firstName = member.first_name || member.NAME || '';
    const lastName = member.last_name || member['LAST NAME'] || '';

    const response = {
      ...member,
      name: `${firstName} ${lastName}`.trim() || 'Unknown Member',
      contact_numbers: visible ? (member.contact_numbers || []) : [],
    };

    reply.send(response);
  });
};

export default memberRoutes;
