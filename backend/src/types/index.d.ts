import { FastifyInstance, FastifyRequest } from 'fastify';
import IORedis from 'ioredis';
import { Config } from '../config/env';
import '@fastify/jwt';
import '@fastify/multipart';

declare module 'fastify' {
  interface FastifyInstance {
    models: any;
    redis: IORedis;
    config: Config;
    authenticate: (request: any, reply: any) => Promise<void>;
    requireRole: (role: 'admin' | 'member') => (request: any, reply: any) => Promise<void>;
  }

  interface FastifyRequest {
    // Already augmented by @fastify/jwt and @fastify/multipart
  }
}
