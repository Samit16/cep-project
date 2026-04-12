import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import config from '../config/env';
import getSupabase from '../config/supabase';

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Keep JWT plugin for backward compatibility during transition
  await fastify.register(require('@fastify/jwt'), {
    secret: config.jwtSecret,
  });

  /**
   * Verify Supabase access token from Authorization header.
   * Attaches user info to request.supabaseUser.
   */
  fastify.decorate('authenticateSupabase', async (request: any, reply: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = getSupabase();

    // Verify the JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }

    // Fetch the user's profile to get their role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, member_id, is_first_login, is_active')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return reply.code(401).send({ error: 'User profile not found' });
    }

    if (!profile.is_active) {
      return reply.code(403).send({ error: 'Account is deactivated' });
    }

    // Attach user info to request
    request.supabaseUser = {
      id: user.id,
      email: user.email,
      role: profile.role,
      member_id: profile.member_id,
      is_first_login: profile.is_first_login,
    };
  });

  // Legacy & Unified Authenticate (works with both Supabase and backwards-compatible JWTs)
  fastify.decorate('authenticate', async (request: any, reply: any) => {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      // Try Supabase auth first
      const supabase = getSupabase();
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (!error && user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, member_id, is_first_login, is_active')
          .eq('id', user.id)
          .single();

        if (profile && profile.is_active) {
          request.supabaseUser = {
            id: user.id,
            email: user.email,
            role: profile.role,
            member_id: profile.member_id,
            is_first_login: profile.is_first_login,
          };
          return; // Supabase authentication successful
        }
      }
    }

    // Fall back to legacy JWT if Supabase fails or token is missing
    try {
      await request.jwtVerify();
      const payload = request.user as any;
      request.supabaseUser = {
        id: payload.userId || payload.sub,
        email: '',
        role: payload.role,
        member_id: payload.sub,
        is_first_login: false,
      };
    } catch (err) {
      reply.code(401).send({ error: 'Authentication required' });
    }
  });

  // Role-based preValidation hook (works with both legacy JWT and Supabase)
  fastify.decorate('requireRole', (roleOrRoles: 'admin' | 'member' | 'committee' | ('admin' | 'member' | 'committee')[]) => {
    return async (request: any, reply: any) => {
      const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];

      // Try Supabase auth first
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const supabase = getSupabase();
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (!error && user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, member_id, is_first_login, is_active')
            .eq('id', user.id)
            .single();

          if (profile && profile.is_active) {
            request.supabaseUser = {
              id: user.id,
              email: user.email,
              role: profile.role,
              member_id: profile.member_id,
              is_first_login: profile.is_first_login,
            };

            if (!roles.includes(profile.role)) {
              return reply.code(403).send({ error: 'Forbidden: insufficient role' });
            }
            return; // Auth successful
          }
        }
      }

      // Fall back to legacy JWT
      try {
        await request.jwtVerify();
        const payload = request.user as any;
        if (!roles.includes(payload.role)) {
          reply.code(403).send({ error: 'Forbidden: insufficient role' });
        }
      } catch (err) {
        reply.code(401).send({ error: 'Authentication required' });
      }
    };
  });
};

export default fp(authPlugin, { name: 'authPlugin' });
