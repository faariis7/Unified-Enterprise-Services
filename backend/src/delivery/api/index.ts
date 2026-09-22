import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { pino } from 'pino';
import { PostgresDatabase } from '../adapters/database/PostgresDatabase.js';
import { RequestRepository } from '../adapters/repositories/RequestRepository.js';
import { CreateRequestUseCase } from '../application/use-cases/CreateRequestUseCase.js';

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
  const db = new PostgresDatabase();
  const requestRepository = new RequestRepository(db);
  const createRequestUseCase = new CreateRequestUseCase(requestRepository);

  // Health check endpoint
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

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

  app.get('/api/v1/requests', async (request, reply) => {
    // TODO: Implement get requests list
    return { requests: [] };
  });

  app.get('/api/v1/requests/:id', async (request, reply) => {
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
