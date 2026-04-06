import { FastifyPluginAsync } from 'fastify';
import { encryptField } from '../plugins/encryption';
import { getPagination } from '../utils/pagination';

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preValidation', (fastify as any).requireRole(['admin', 'committee']));

  // List members
  fastify.get('/members', async (request, reply) => {
    const { skip, take } = getPagination(request.query);
    const { name } = request.query as any;
    const query: any = {};
    if (name) {
      query.$or = [
        { first_name: { $regex: name, $options: 'i' } },
        { last_name: { $regex: name, $options: 'i' } },
      ];
    }
    const members = await (fastify as any).models.Member.find(query)
      .skip(skip)
      .limit(take)
      .lean();
    const result = members.map((m: any) => ({
      ...m,
      name: `${m.first_name || ''} ${m.last_name || ''}`.trim(),
    }));
    reply.send(result);
  });

  // Create member
  fastify.post('/members', async (request, reply) => {
    const data = request.body as any;
    const encrypted = {
      ...data,
      contact_numbers: data.contact_numbers?.map((num: string) => encryptField(num)) || [],
    };
    const member = await (fastify as any).models.Member.create(encrypted);
    reply.code(201).send(member);
  });

  // Update member
  fastify.put('/members/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const encrypted = {
      ...data,
      contact_numbers: data.contact_numbers ? data.contact_numbers.map((num: string) => encryptField(num)) : undefined,
    };
    const member = await (fastify as any).models.Member.findByIdAndUpdate(id, encrypted, { new: true });
    reply.send(member);
  });

  // Deactivate
  fastify.patch('/members/:id/deactivate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const member = await (fastify as any).models.Member.findByIdAndUpdate(id, { active: false }, { new: true });
    await (fastify as any).models.AuditLog.create({
      memberId: id,
      action: 'deactivate',
      createdAt: new Date(),
    });
    reply.send(member);
  });

  // Export CSV
  fastify.get('/members/export', async (request, reply) => {
    const members = await (fastify as any).models.Member.find({}).lean();
    const csvHeader = ['First Name', 'Last Name', 'Address', 'Contact Numbers', 'Email', 'Occupation', 'Town', 'Status'].join(',');
    const csvRows = members
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

  // Audit logs
  fastify.get('/audit-logs', async (request, reply) => {
    const logs = await (fastify as any).models.AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    reply.send(logs);
  });

  // Approve update - logic shifted slightly as we don't have a dedicated updateRequest model 
  // We'll assume these are approved by checking AuditLogs or a similar mechanism 
  // For now, let's just stub this for Mongoose compatibility
  fastify.put('/update-requests/:id/approve', async (request, reply) => {
    reply.code(501).send({ error: 'Update requests feature refactoring in progress' });
  });
};

export default adminRoutes;
