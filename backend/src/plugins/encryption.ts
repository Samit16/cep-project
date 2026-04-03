import crypto from 'crypto';
import config from '../config/env';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(config.aesKey, 'base64');

export function encryptField(plain: string): string {
  if (!plain) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptField(cipherText: string): string {
  if (!cipherText) return cipherText;
  const data = Buffer.from(cipherText, 'base64');
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const encrypted = data.slice(28);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
