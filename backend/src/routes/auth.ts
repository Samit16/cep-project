import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { randomInt } from 'crypto';
import config from '../config/env';
import { encryptField } from '../plugins/encryption';
import getSupabase from '../config/supabase';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // ============================================
  // Supabase Auth - Get current user profile
  // ============================================
  fastify.get('/me', { preValidation: [(fastify as any).authenticateSupabase] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).supabaseUser;
    const supabase = getSupabase();

    // Fetch profile with member data if linked
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        role,
        member_id,
        is_first_login,
        is_active,
        members (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return reply.code(404).send({ error: 'Profile not found' });
    }

    reply.send({
      id: user.id,
      email: user.email,
      role: profile.role,
      member_id: profile.member_id,
      is_first_login: profile.is_first_login,
      member: (profile as any).members || null,
    });
  });

  // ============================================
  // Supabase Auth - Update user role (admin only)
  // ============================================
  fastify.put('/users/:userId/role', { preValidation: [(fastify as any).requireRole('admin')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as { userId: string };
    const { role } = request.body as { role: 'member' | 'committee' | 'admin' };

    if (!['member', 'committee', 'admin'].includes(role)) {
      return reply.code(400).send({ error: 'Invalid role. Must be member, committee, or admin.' });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) {
      return reply.code(500).send({ error: 'Failed to update role' });
    }

    reply.send({ message: 'Role updated successfully' });
  });

  // ============================================
  // Supabase Auth - Link profile to member record
  // ============================================
  fastify.put('/link-member', { preValidation: [(fastify as any).authenticateSupabase] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).supabaseUser;
    const { member_id } = request.body as { member_id: string };

    const supabase = getSupabase();

    // Verify the member exists
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('id', member_id)
      .single();

    if (memberError || !member) {
      return reply.code(404).send({ error: 'Member not found' });
    }

    // Update profile
    const { error } = await supabase
      .from('profiles')
      .update({ member_id, is_first_login: false })
      .eq('id', user.id);

    if (error) {
      return reply.code(500).send({ error: 'Failed to link member' });
    }

    reply.send({ message: 'Member linked successfully' });
  });


};

export default authRoutes;
