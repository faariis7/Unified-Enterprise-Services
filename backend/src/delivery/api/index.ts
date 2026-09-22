import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { pino } from 'pino';

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
    contentSecurityPolicy: false, // Configure based on your needs
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    sign: { expiresIn: '1d' },
  });

  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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

  // Health check endpoint
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API Routes (to be implemented)
  // await app.register(requestRoutes, { prefix: '/api/v1/requests' });
  // await app.register(authRoutes, { prefix: '/api/v1/auth' });
  // await app.register(workspaceRoutes, { prefix: '/api/v1/workspaces' });

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
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
