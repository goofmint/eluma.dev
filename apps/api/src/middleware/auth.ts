import { createMiddleware } from 'hono/factory';
import * as jose from 'jose';
import { getEnv } from '../lib/supabase';
import type { AppEnv, AuthUser } from '../types';

// JWT payload structure from Supabase Auth
interface JWTPayload {
  sub: string;
  email?: string;
  role?: string;
  aud?: string;
  exp?: number;
  iat?: number;
}

// Auth middleware - validates JWT and sets user in context
export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' }, 401);
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  const jwtSecret = getEnv(c, 'JWT_SECRET');

  if (!jwtSecret) {
    console.error('JWT_SECRET not configured');
    return c.json({ error: 'Server configuration error', code: 'SERVER_ERROR' }, 500);
  }

  try {
    // Verify JWT using jose
    const secretKey = new TextEncoder().encode(jwtSecret);
    const { payload } = await jose.jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    const jwtPayload = payload as unknown as JWTPayload;

    // Set user in context
    const user: AuthUser = {
      id: jwtPayload.sub,
      email: jwtPayload.email,
      role: jwtPayload.role,
    };

    c.set('user', user);
    c.set('accessToken', token);

    await next();
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      return c.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, 401);
    }
    if (error instanceof jose.errors.JWTInvalid) {
      return c.json({ error: 'Invalid token', code: 'INVALID_TOKEN' }, 401);
    }
    console.error('JWT verification error:', error);
    return c.json({ error: 'Authentication failed', code: 'AUTH_FAILED' }, 401);
  }
});

// Optional auth middleware - sets user if valid token, but doesn't require it
export const optionalAuthMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    await next();
    return;
  }

  const token = authHeader.slice(7);
  const jwtSecret = getEnv(c, 'JWT_SECRET');

  if (!jwtSecret) {
    await next();
    return;
  }

  try {
    const secretKey = new TextEncoder().encode(jwtSecret);
    const { payload } = await jose.jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    const jwtPayload = payload as unknown as JWTPayload;

    const user: AuthUser = {
      id: jwtPayload.sub,
      email: jwtPayload.email,
      role: jwtPayload.role,
    };

    c.set('user', user);
    c.set('accessToken', token);
  } catch {
    // Ignore errors for optional auth
  }

  await next();
});

// Helper to get current user from context (throws if not authenticated)
export const requireUser = (c: { get: (key: 'user') => AuthUser | undefined }): AuthUser => {
  const user = c.get('user');
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
};
