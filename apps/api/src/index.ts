import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { getEnv } from './lib/supabase';
import bookmarks from './routes/bookmarks';
import type { AppEnv } from './types';

const app = new OpenAPIHono<AppEnv>();

// Enable CORS for all routes
app.use('*', async (c, next) => {
  const allowedOrigins = getEnv(c, 'ALLOWED_ORIGINS') || '*';

  const corsMiddleware = cors({
    origin: (origin) => {
      if (allowedOrigins === '*') {
        return origin;
      }
      const whitelist = allowedOrigins.split(',').map((o) => o.trim());
      return whitelist.includes(origin) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  });

  return corsMiddleware(c, next);
});

// Schema definitions
const HealthCheckResponseSchema = z
  .object({
    status: z.string().openapi({ example: 'ok' }),
    timestamp: z.string().datetime().openapi({ example: '2025-01-01T00:00:00.000Z' }),
    service: z.string().openapi({ example: 'eluma-api' }),
  })
  .openapi('HealthCheckResponse');

const RootResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'Eluma API' }),
    version: z.string().openapi({ example: '0.0.1' }),
    docs: z.string().openapi({ example: '/doc' }),
  })
  .openapi('RootResponse');

// Route definitions
const healthzRoute = createRoute({
  method: 'get',
  path: '/healthz',
  tags: ['Health'],
  summary: 'Health check endpoint',
  description: 'Returns the health status of the API server',
  responses: {
    200: {
      content: { 'application/json': { schema: HealthCheckResponseSchema } },
      description: 'API is healthy',
    },
  },
});

const rootRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['General'],
  summary: 'API root endpoint',
  description: 'Returns basic API information and documentation link',
  responses: {
    200: {
      content: { 'application/json': { schema: RootResponseSchema } },
      description: 'API information',
    },
  },
});

// Register routes
app.openapi(healthzRoute, (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'eluma-api',
  });
});

app.openapi(rootRoute, (c) => {
  return c.json({
    message: 'Eluma API',
    version: '0.0.1',
    docs: '/doc',
  });
});

// Mount bookmark routes (nginx strips /api prefix)
app.route('/bookmarks', bookmarks);

// OpenAPI documentation endpoint
app.doc('/doc', (c) => {
  const protocol = c.req.header('x-forwarded-proto') || 'https';
  const host = c.req.header('host') || 'localhost';
  const baseUrl = `${protocol}://${host}`;

  return {
    openapi: '3.0.0',
    info: {
      title: 'Eluma API',
      version: '0.0.1',
      description: 'AI-Optimized Social Bookmark Platform API',
    },
    servers: [{ url: baseUrl, description: 'Current server' }],
    components: {
      securitySchemes: {
        Bearer: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
    },
  };
});

export default app;
