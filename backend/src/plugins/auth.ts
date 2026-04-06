import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import config from '../config/env';

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Register JWT plugin
  await fastify.register(require('@fastify/jwt'), {
    secret: config.jwtSecret,
    sign: { expiresIn: '30m' }, // session timeout
  });

  // Decorator to verify JWT and attach user payload
  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // Role‑based preValidation hook
  fastify.decorate('requireRole', (roleOrRoles: 'admin' | 'member' | 'committee' | ('admin' | 'member' | 'committee')[]) => {
    return async (request: any, reply: any) => {
      try {
        await request.jwtVerify();
        const payload = request.user as any;
        const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
        
        if (!roles.includes(payload.role)) {
          reply.code(403).send({ error: 'Forbidden: insufficient role' });
        }
      } catch (err) {
        reply.send(err);
      }
    };
  });
};

export default fp(authPlugin, { name: 'authPlugin' });
