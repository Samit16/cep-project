import { FastifyPluginAsync } from 'fastify';
import { getPagination } from '../utils/pagination';

const eventsRoutes: FastifyPluginAsync = async (fastify) => {
  // Public GET
  fastify.get('/', async (request, reply) => {
    const { skip, take } = getPagination(request.query);
    const events = await (fastify as any).models.Event.find({})
      .skip(skip)
      .limit(take)
      .lean();
    reply.send(events);
  });

  // Admin writes
  fastify.post('/', { preValidation: [fastify.requireRole('admin')] }, async (request, reply) => {
    const data = request.body as any;
    const event = await (fastify as any).models.Event.create(data);
    reply.code(201).send(event);
  });

  fastify.put('/:id', { preValidation: [fastify.requireRole('admin')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const event = await (fastify as any).models.Event.findByIdAndUpdate(id, data, { new: true });
    reply.send(event);
  });

  fastify.delete('/:id', { preValidation: [fastify.requireRole('admin')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await (fastify as any).models.Event.findByIdAndDelete(id);
    reply.send({ message: 'Deleted' });
  });
};
export default eventsRoutes;
