import { FastifyPluginAsync } from 'fastify';
import { getPagination } from '../utils/pagination';
import { decryptField, encryptField } from '../plugins/encryption';

const memberRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preValidation', fastify.authenticate);

  // GET paginated list with search filters
  fastify.get('/', async (request, reply) => {
    const { skip, take } = getPagination(request.query);
    const { name, city, occupation } = request.query as any;

    const query: any = { active: { $ne: false } };
    if (name) {
      query.$or = [
        { first_name: { $regex: name, $options: 'i' } },
        { last_name: { $regex: name, $options: 'i' } },
      ];
    }
    if (city) query.current_place = city; 
    if (occupation) query.occupation = occupation;

    const members = await (fastify as any).models.Member.find(query)
      .skip(skip)
      .limit(take)
      .lean();

    const result = members.map((m: any) => {
      const decrypted = (m.contact_numbers || []).map((num: string) => decryptField(num));
      return {
        ...m,
        name: `${m.first_name || ''} ${m.last_name || ''}`.trim(),
        contact_no: decrypted[0] || '',
        contact_numbers: decrypted,
      };
    });

    reply.send(result);
  });

  // GET by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const member = await (fastify as any).models.Member.findById(id).lean();
    if (!member) return reply.code(404).send({ error: 'Not found' });

    const payload = request.user as any;
    const encryptedSub = encryptField(payload.sub);
    const isOwner = member.contact_numbers.includes(encryptedSub);
    const visible = member.contact_visibility === 'public' || isOwner;

    const response = {
      ...member,
      contact_numbers: visible ? member.contact_numbers.map((num: string) => decryptField(num)) : [],
    };
    reply.send(response);
  });

  // GET /me
  fastify.get('/me', async (request, reply) => {
    const payload = request.user as any;
    const encryptedSub = encryptField(payload.sub);
    const member = await (fastify as any).models.Member.findOne({ contact_numbers: encryptedSub }).lean();
    if (!member) return reply.code(404).send({ error: 'Not found' });
    const result = {
      ...member,
      contact_numbers: member.contact_numbers.map((num: string) => decryptField(num)),
    };
    reply.send(result);
  });

  // PUT /me/update-request
  fastify.put('/me/update-request', async (request, reply) => {
    const payload = request.user as any;
    const changes = request.body;
    await (fastify as any).models.AuditLog.create({
      memberId: payload.sub,
      action: 'update-request',
      payload: JSON.stringify(changes),
      createdAt: new Date(),
    });
    reply.send({ message: 'Update request recorded' });
  });
};

export default memberRoutes;
