import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import os from 'os';
import path from 'path';
import fs from 'fs';

const multipartPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(require('@fastify/multipart'), {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
    async onFile(part: any) {
      const tmpDir = os.tmpdir();
      const filePath = path.join(tmpDir, `${Date.now()}-${part.filename}`);
      const writeStream = fs.createWriteStream(filePath);
      await part.file.pipe(writeStream);
      // Attach the temp path to request for later use
      (part as any).tempFilePath = filePath;
    },
  });
};

export default fp(multipartPlugin, { name: 'multipartPlugin' });
