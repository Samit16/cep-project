import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { randomInt } from 'crypto';
import config from '../config/env';
import { encryptField } from '../plugins/encryption';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // OTP request
  fastify.post('/otp/request', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!(fastify as any).redis) {
      return reply.code(503).send({ error: 'OTP service is temporarily unavailable (Redis not connected)' });
    }

    const { contact_no } = request.body as { contact_no: string };

    // Ensure member exists with this number
    const encrypted = encryptField(contact_no);
    const member = await (fastify as any).models.Member.findOne({ contact_numbers: encrypted });
    if (!member) {
      return reply.code(404).send({ error: 'Member not found with this contact number' });
    }

    const otp = randomInt(100000, 999999).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const key = `otp:${contact_no}`;
    await (fastify as any).redis.set(key, hashedOtp, 'EX', 300);
    
    // Log OTP for development — replace with SMS gateway in production
    (fastify as any).log.info(`[Auth] Generated OTP for ${contact_no}: ${otp}`);
    
    reply.send({ message: 'OTP sent' });
  });

  // OTP verify
  fastify.post('/otp/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!(fastify as any).redis) {
      return reply.code(503).send({ error: 'OTP service is temporarily unavailable (Redis not connected)' });
    }

    const { contact_no, otp } = request.body as { contact_no: string; otp: string };
    const key = `otp:${contact_no}`;
    const stored = await (fastify as any).redis.get(key);
    if (!stored) {
      return reply.code(400).send({ error: 'OTP expired or not requested' });
    }
    const hashed = crypto.createHash('sha256').update(otp).digest('hex');
    if (hashed !== stored) {
      return reply.code(401).send({ error: 'Invalid OTP' });
    }
    await (fastify as any).redis.del(key);
    const token = (fastify as any).jwt.sign({ sub: contact_no, role: 'member' });
    reply.send({ token });
  });

  // Admin / Committee login — plain-text password comparison
  fastify.post('/admin/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const { username, password } = request.body as {
      username: string;
      password: string;
      remember?: boolean;
    };

    // 1. Check Admin collection
    const admin = await (fastify as any).models.Admin.findOne({ username }).lean();
    if (admin) {
      if ((admin as any).password !== password) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }
      const payload: any = { sub: (admin as any)._id, role: 'admin' };
      const token = (fastify as any).jwt.sign(payload);
      return reply.send({ token });
    }

    // 2. Check User collection for committee member
    const user = await (fastify as any).models.User.findOne({ username, role: 'committee' });
    if (user) {
      if (user.password !== password) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }
      const payload: any = { sub: user.member_id, userId: user._id, role: 'committee' };
      const token = (fastify as any).jwt.sign(payload);
      return reply.send({ token });
    }

    return reply.code(401).send({ error: 'Invalid credentials' });
  });

  // Member login — plain-text password comparison
  fastify.post('/member/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const { username, password } = request.body as { username?: string; password?: string };
    if (!username || !password) return reply.code(400).send({ error: 'Username and password required' });

    let user = await (fastify as any).models.User.findOne({ username });

    if (!user) {
      // Try to auto-create user from member record using default username pattern (firstname_lastname)
      const underscoreIdx = username.lastIndexOf('_');
      if (underscoreIdx !== -1) {
        const firstName = username.substring(0, underscoreIdx);
        const lastName = username.substring(underscoreIdx + 1);

        const member = await (fastify as any).models.Member.findOne({
          first_name: { $regex: new RegExp(`^${firstName}$`, 'i') },
          last_name: { $regex: new RegExp(`^${lastName}$`, 'i') }
        });

        if (member) {
          const settings = await (fastify as any).models.SystemSetting.findOne();
          if (settings && settings.default_password === password) {
            user = await (fastify as any).models.User.create({
              username,
              password,
              role: 'member',
              member_id: member._id,
              is_first_login: true,
              is_active: true
            });
          }
        }
      }
    } else {
      if (user.password !== password) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }
    }

    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const token = (fastify as any).jwt.sign({ sub: user.member_id, userId: user._id, role: 'member' });
    reply.send({ token });
  });

  // Member update credentials
  fastify.post('/member/update-credentials', { preValidation: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = (request as any).user;
    if (payload.role !== 'member') {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const { new_username, new_password } = request.body as { new_username?: string; new_password?: string };
    if (!new_username || !new_password) {
      return reply.code(400).send({ error: 'Missing new_username or new_password' });
    }

    const user = await (fastify as any).models.User.findById(payload.userId);
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    if (user.username !== new_username) {
      const existing = await (fastify as any).models.User.findOne({ username: new_username });
      if (existing) {
        return reply.code(400).send({ error: 'Username already taken' });
      }
    }

    await (fastify as any).models.User.updateOne(
      { _id: user._id },
      {
        $set: {
          username: new_username,
          password: new_password,
          is_first_login: false
        }
      }
    );

    reply.send({ message: 'Credentials updated successfully' });
  });

  // Logout
  fastify.post('/logout', { preValidation: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({ message: 'Logged out' });
  });
};

export default authRoutes;
