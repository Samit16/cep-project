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
    
    // Instead of sending OTP to client, log it for development purposes. 
    // In production, integrate with an SMS gateway here.
    (fastify as any).log.info(`[Auth] Generated OTP for ${contact_no}: ${otp}`);
    
    reply.send({ message: 'OTP sent' });
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
    const token = fastify.jwt.sign({ sub: contact_no, role: 'member' });
    reply.send({ token });
  });

  // Admin login
  fastify.post('/admin/login', async (request, reply) => {
    const { username, password, remember } = request.body as {
      username: string;
      password: string;
      remember?: boolean;
    };
    const admin = await (fastify as any).models.Admin.findOne({ username }).lean();
    if (!admin) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return reply.code(401).send({ error: 'Invalid credentials' });
    
    const payload: any = { sub: (admin as any)._id, role: 'admin' };
    const token = fastify.jwt.sign(payload, { expiresIn: remember ? '7d' : '30m' });
    reply.send({ token });
  });

  // Logout
  fastify.post('/logout', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const payload = request.user as any;
    if (payload.role === 'admin' && payload.remember) {
      await fastify.redis.del(`remember:${payload.sub}`);
    }
    reply.send({ message: 'Logged out' });
  });
};

export default authRoutes;
