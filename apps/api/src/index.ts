import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS for all routes
app.use(
  '*',
  cors({
    origin: (origin) => {
      // In Workers, use c.env; in Node.js, use process.env
      const allowedOrigins =
        process.env.ALLOWED_ORIGINS || 'https://eluma.test';

      if (allowedOrigins === '*') {
        return origin;
      }

      const whitelist = allowedOrigins.split(',').map((o) => o.trim());
      return whitelist.includes(origin) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Health check endpoint
app.get('/healthz', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'eluma-api',
  });
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Eluma API',
    version: '0.0.1',
    docs: '/healthz',
  });
});

export default app;
