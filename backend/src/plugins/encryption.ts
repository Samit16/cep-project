import crypto from 'crypto';
import config from '../config/env';
import { logger } from '../utils/logger';

const algorithm = 'aes-256-gcm';
let key = Buffer.from(config.aesKey, 'base64');

if (key.length !== 32) {
  logger.warn('AES_256_KEY is invalid or missing. Falling back to a temporary default key. Do NOT use this in production!');
  key = Buffer.from('Q1D22lO84uRYwC4EX4eTfmh9y1HhS2Be1m0YWg7ZNvI=', 'base64');
}

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
  try {
    const data = Buffer.from(cipherText, 'base64');
    const iv = data.slice(0, 12);
    const tag = data.slice(12, 28);
    const encrypted = data.slice(28);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    // Return placeholder if decryption fails (wrong key, corrupted data, etc.)
    return '[encrypted]';
  }
}
