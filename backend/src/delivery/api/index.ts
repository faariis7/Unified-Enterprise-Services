import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { sql } from 'kysely';
import { pino } from 'pino';
import { PostgresDatabase } from '../../adapters/database/PostgresDatabase.js';
import { PostgresRequestRepository as RequestRepository } from '../../adapters/repositories/PostgresRequestRepository.js';
import { CreateRequestUseCase } from '../../application/use-cases/CreateRequestUseCase.js';
import { InMemoryEventPublisher } from '../../domain/events/DomainEvent.js';

const buildApp = async () => {
  const app = Fastify({
    logger: pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' 
        ? { target: 'pino-pretty' }
        : undefined,
    }),
  });

  // Register plugins
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    sign: { expiresIn: '1d' },
  });

  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Unified ESM API',
        description: 'Enterprise Service Management API',
        version: '0.1.0',
      },
      servers: [{ url: '/api/v1' }],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list' },
  });

  // Initialize database and repositories
  const database = new PostgresDatabase({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'unified_esm',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });
  const db = await database.connect();
  const requestRepository = new RequestRepository(database);
  const eventPublisher = new InMemoryEventPublisher();
  const createRequestUseCase = new CreateRequestUseCase(requestRepository, eventPublisher);

  // Health check endpoint with service validation
  app.get('/health', async (_request, reply) => {
    const healthStatus = {
      status: 'ok' as 'ok' | 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown' as 'connected' | 'disconnected' | 'unknown',
        redis: 'unknown' as 'connected' | 'disconnected' | 'unknown',
        storage: 'unknown' as 'connected' | 'disconnected' | 'unknown',
      },
    };

    // Check database
    try {
      await db.selectNoFrom(sql`1`.as('one')).execute();
      healthStatus.services.database = 'connected';
    } catch {
      healthStatus.services.database = 'disconnected';
      healthStatus.status = 'degraded' as const;
    }

    // Check Redis
    try {
      const redis = require('ioredis');
      const redisClient = new redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      });
      await redisClient.ping();
      await redisClient.quit();
      healthStatus.services.redis = 'connected';
    } catch {
      healthStatus.services.redis = 'disconnected';
      healthStatus.status = 'degraded' as const;
    }

    // Check Storage (MinIO)
    try {
      const response = await fetch(`http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}/minio/health/live`);
      if (response.ok) {
        healthStatus.services.storage = 'connected';
      } else {
        throw new Error('Storage not responding');
      }
    } catch {
      healthStatus.services.storage = 'disconnected';
      healthStatus.status = 'degraded' as const;
    }

    return reply.send(healthStatus);
  });

  // Readiness probe - checks if app is ready to accept traffic
  app.get('/health/ready', async (_request, reply) => {
    try {
      await db.selectNoFrom(sql`1`.as('one')).execute();
      return reply.send({ status: 'ready', timestamp: new Date().toISOString() });
    } catch {
      return reply.code(503).send({ status: 'not_ready', reason: 'database_disconnected' });
    }
  });

  // Liveness probe - checks if app is still alive
  app.get('/health/live', async () => ({ status: 'alive', timestamp: new Date().toISOString() }));

  // Authentication routes (hardcoded for now)
  app.post('/api/v1/auth/login', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };
    
    // TODO: Replace with real authentication service
    if (email.includes('@') && password.length >= 8) {
      const token = app.jwt.sign({ email, name: email.split('@')[0] });
      return { token, user: { email, name: email.split('@')[0] } };
    }
    
    return reply.code(401).send({ error: 'Invalid credentials' });
  });

  // Requests API
  app.post('/api/v1/requests', async (request, reply) => {
    try {
      const body = request.body as any;
      const result = await createRequestUseCase.execute(body);
      return reply.code(201).send(result);
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });

  app.get('/api/v1/requests', async (_request, _reply) => {
    // TODO: Implement get requests list
    return { requests: [] };
  });

  app.get('/api/v1/requests/:id', async (request, _reply) => {
    const { id } = request.params as { id: string };
    // TODO: Implement get request by ID
    return { request: { id } };
  });

  return app;
};

const start = async () => {
  const app = await buildApp();
  
  const host = process.env.HOST || '0.0.0.0';
  const port = parseInt(process.env.PORT || '3000');

  try {
    await app.listen({ host, port });
    console.log(`🚀 Server running at http://${host}:${port}`);
    console.log(`📚 API Documentation at http://${host}:${port}/docs`);
    console.log(`💾 Database: ${process.env.DB_NAME || 'unified_esm'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
