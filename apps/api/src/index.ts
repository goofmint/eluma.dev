import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_KEY?: string;
  JWT_SECRET?: string;
  ALLOWED_ORIGINS?: string;
  NODE_ENV?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for all routes
app.use('*', (c, next) => {
  const allowedOrigins = c.env.ALLOWED_ORIGINS;
  const nodeEnv = c.env.NODE_ENV;

  // In development, allow all origins
  if (nodeEnv === 'development' || allowedOrigins === '*') {
    return cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    })(c, next);
  }

  // In production, use whitelist
  const whitelist = allowedOrigins ? allowedOrigins.split(',').map((o) => o.trim()) : [];

  return cors({
    origin: (origin) => {
      // If no whitelist configured in production, reject
      if (whitelist.length === 0) {
        return null;
      }
      // Check if origin is in whitelist
      return whitelist.includes(origin) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })(c, next);
});

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
