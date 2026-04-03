import { logger } from '../utils/logger';

export class EventService {
  constructor(private models: any) {}

  async create(data: any) {
    const event = await this.models.Event.create(data);
    await this.audit('create', event.id, data);
    return event;
  }

  async findMany(pagination: any) {
    return await this.models.Event.find({})
      .skip(pagination.skip)
      .limit(pagination.take)
      .lean();
  }

  async update(id: string, data: any) {
    const event = await this.models.Event.findByIdAndUpdate(id, data, { new: true });
    await this.audit('update', id, data);
    return event;
  }

  private async audit(action: string, eventId: string, payload: any) {
    await this.models.AuditLog.create({
      memberId: 'admin', // Events are created by admins
      action: `event-${action}`,
      payload: JSON.stringify({ eventId, ...payload }),
      createdAt: new Date(),
    });
    logger.info(`Audit ${action} for event ${eventId}`);
  }
}
