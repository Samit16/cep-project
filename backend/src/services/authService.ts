import crypto from 'crypto';
import bcrypt from 'bcrypt';

export async function generateOtp(phone: string, redis: any) {
  const otp = crypto.randomInt(100000, 999999).toString();
  const hashed = crypto.createHash('sha256').update(otp).digest('hex');
  await redis.set(`otp:${phone}`, hashed, 'EX', 300);
  return otp; 
}

export async function verifyOtp(phone: string, otp: string, redis: any) {
  const key = `otp:${phone}`;
  const stored = await redis.get(key);
  if (!stored) return false;
  const hashed = crypto.createHash('sha256').update(otp).digest('hex');
  if (hashed !== stored) return false;
  await redis.del(key);
  return true;
}

export async function adminLogin(username: string, password: string, models: any) {
  const admin = await models.Admin.findOne({ username });
  if (!admin) return null;
  const ok = await bcrypt.compare(password, admin.passwordHash);
  return ok ? admin : null;
}
