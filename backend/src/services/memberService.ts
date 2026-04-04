import { encryptField, decryptField } from '../plugins/encryption';
import { logger } from '../utils/logger';

export class MemberService {
  constructor(private models: any) {}

  async create(data: any) {
    const encrypted = {
      ...data,
      contact_numbers: data.contact_numbers?.map((num: string) => encryptField(num)) || [],
    };
    const member = await this.models.Member.create(encrypted);
    return member;
  }

  async findMany(filters: any, pagination: any) {
    const members = await this.models.Member.find({ active: true, ...filters })
      .skip(pagination.skip)
      .limit(pagination.take)
      .lean();

    return members.map((m: any) => ({
      ...m,
      contact_numbers: m.contact_numbers?.map((num: string) => decryptField(num)) || [],
    }));
  }

  private async audit(action: string, memberId: string, payload: any) {
    await this.models.AuditLog.create({
      memberId,
      action,
      payload: JSON.stringify(payload),
      createdAt: new Date(),
    });
    logger.info(`Audit ${action} for member ${memberId}`);
  }
}
