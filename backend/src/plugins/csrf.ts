import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const csrfPlugin: FastifyPluginAsync = async (fastify) => {
  // Custom CSRF check: require X-Requested-With header on state‑changing methods
  fastify.addHook('preHandler', async (request, reply) => {
    const method = request.method;
    const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (unsafeMethods.includes(method)) {
      const header = request.headers['x-requested-with'];
      if (header !== 'XMLHttpRequest') {
        reply.code(403).send({ error: 'CSRF validation failed' });
      }
    }
  });
};

export default fp(csrfPlugin, { name: 'csrfPlugin' });
