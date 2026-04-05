import { FastifyPluginAsync } from 'fastify';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import config from '../config/env';
import { encryptField } from '../plugins/encryption';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // OTP request
  fastify.post('/otp/request', async (request, reply) => {
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
    await fastify.redis.set(key, hashedOtp, 'EX', 300);
    reply.send({ message: 'OTP sent', dev_otp: otp });
  });


  // OTP verify
  fastify.post('/otp/verify', async (request, reply) => {
    const { contact_no, otp } = request.body as { contact_no: string; otp: string };
    const key = `otp:${contact_no}`;
    const stored = await fastify.redis.get(key);
    if (!stored) {
      return reply.code(400).send({ error: 'OTP expired or not requested' });
    }
    const hashed = crypto.createHash('sha256').update(otp).digest('hex');
    if (hashed !== stored) {
      return reply.code(401).send({ error: 'Invalid OTP' });
    }
    await fastify.redis.del(key);
    const token = (fastify as any).jwt.sign({ sub: contact_no, role: 'member' });
    reply.send({ token });
  });

  // Admin & Committee login
  fastify.post('/admin/login', async (request, reply) => {
    const { username, password, remember } = request.body as {
      username: string;
      password: string;
      remember?: boolean;
    };
    
    // Check Admin collection
    const admin = await (fastify as any).models.Admin.findOne({ username }).lean();
    if (admin) {
      const valid = await bcrypt.compare(password, admin.passwordHash);
      if (!valid) return reply.code(401).send({ error: 'Invalid credentials' });
  
      const payload: any = { sub: (admin as any)._id, role: 'admin' };
      const token = (fastify as any).jwt.sign(payload, { expiresIn: remember ? '7d' : '30m' });
      return reply.send({ token });
    }

    // Check User collection for committee member
    const user = await (fastify as any).models.User.findOne({ username, role: 'committee' });
    if (user) {
      const valid = await user.comparePassword(password);
      if (!valid) return reply.code(401).send({ error: 'Invalid credentials' });

      // If user requires first time password update, handle it
      if (user.is_first_login) {
        const token = (fastify as any).jwt.sign({ sub: user.member_id, userId: user._id, role: 'committee', update_required: true }, { expiresIn: '15m' });
        return reply.send({ token, message: 'Please update your credentials', update_required: true });
      }

      const payload: any = { sub: user.member_id, userId: user._id, role: 'committee' };
      const token = (fastify as any).jwt.sign(payload, { expiresIn: remember ? '7d' : '30m' });
      return reply.send({ token });
    }

    return reply.code(401).send({ error: 'Invalid credentials' });
  });

  // Member login with default credentials mapping
  fastify.post('/member/login', async (request: any, reply: any) => {
    const { username, password } = request.body as any;
    if (!username || !password) return reply.code(400).send({ error: 'Username and password required' });

    let user = await (fastify as any).models.User.findOne({ username });

    if (!user) {
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
          if (settings && settings.default_password_hash) {
            const valid = await bcrypt.compare(password, settings.default_password_hash);
            if (valid) {
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
      }
    } else {
      const valid = await user.comparePassword(password);
      if (!valid) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }
    }

    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    if (user.is_first_login) {
      const token = (fastify as any).jwt.sign({ sub: user.member_id, userId: user._id, role: 'member', update_required: true }, { expiresIn: '15m' });
      return reply.send({ token, message: 'Please update your credentials', update_required: true });
    }

    const token = (fastify as any).jwt.sign({ sub: user.member_id, userId: user._id, role: 'member' });
    reply.send({ token });
  });

  // Member update credentials route
  fastify.post('/member/update-credentials', { preValidation: [(fastify as any).authenticate] }, async (request: any, reply: any) => {
    const payload = request.user as any;
    if (payload.role !== 'member') {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const { new_username, new_password } = request.body as any;
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

    user.username = new_username;
    user.password = new_password;
    user.is_first_login = false;
    await user.save();

    reply.send({ message: 'Credentials updated successfully' });
  });

  // Logout
  fastify.post('/logout', { preValidation: [(fastify as any).authenticate] }, async (request: any, reply: any) => {
    const payload = request.user as any;
    if (payload.role === 'admin' && payload.remember) {
      await fastify.redis.del(`remember:${payload.sub}`);
    }
    reply.send({ message: 'Logged out' });
  });
};

export default authRoutes;
