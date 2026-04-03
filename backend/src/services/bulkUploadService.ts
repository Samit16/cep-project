import { Job } from 'bullmq';
import fs from 'fs';
import { parse } from 'csv-parse';
import { z } from 'zod';
import { encryptField } from '../plugins/encryption';
import config from '../config/env';
import { logger } from '../utils/logger';
import Member from '../models/Member';
import CsvImportError from '../models/CsvImportError';

const memberSchema = z.object({
  name: z.string().min(2),
  contact_no: z.string().regex(/^\+\d{11,14}$/),
  email: z.string().email(),
  occupation: z.string().optional(),
  marital_status: z.string().optional(),
  current_place: z.string().optional(),
  kutch_town: z.string().optional(),
  family_members: z.array(z.string()).optional().default([]),
  if_alive: z.boolean().default(true),
  contact_visibility: z.enum(['public', 'private']).default('private'),
});

export async function bulkUploadProcessor(job: Job) {
  const { filePath, commit } = job.data as { filePath: string; commit?: boolean };
  const errors: any[] = [];
  let processed = 0;
  let success = 0;
  const batch: any[] = [];

  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    const parser = parse({ columns: true, trim: true });

    parser.on('data', async (row) => {
      processed++;
      const result = memberSchema.safeParse(row);
      if (!result.success) {
        errors.push({
          job_id: job.id,
          row_number: processed,
          field_name: result.error.errors.map((e) => e.path.join('.')).join(', '),
          value: JSON.stringify(row),
          error_message: result.error.message,
          created_at: new Date(),
        });
        return;
      }
      const data = result.data;
      const encrypted = {
        ...data,
        contact_no: encryptField(data.contact_no),
      };
      batch.push(encrypted);
      if (batch.length >= (config.csvBatchSize || 100)) {
        if (commit !== false) {
          await Member.insertMany(batch);
        }
        success += batch.length;
        batch.length = 0;
      }
      if (processed % 50 === 0) {
        await job.updateProgress({ processed, success, errors: errors.length });
      }
    });

    parser.on('end', async () => {
      if (batch.length && commit !== false) {
        await Member.insertMany(batch);
        success += batch.length;
      }
      if (errors.length) {
        await CsvImportError.insertMany(errors);
      }
      await job.updateProgress({ processed, success, errors: errors.length });
      fs.unlink(filePath, (err) => {
        if (err) logger.error({ err }, 'Failed to delete temp CSV');
      });
      resolve(true);
    });

    parser.on('error', (err) => {
      logger.error({ err }, 'CSV parsing error');
      reject(err);
    });

    stream.pipe(parser);
  });
}
