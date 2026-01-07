import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
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

// Shared JWT verification helper
// Returns AuthUser on success, throws on failure
// Validates audience and issuer to reject tokens from other services
async function verifyJWT(
  token: string,
  jwtSecret: string,
  issuer: string
): Promise<AuthUser> {
  const secretKey = new TextEncoder().encode(jwtSecret);
  const { payload } = await jose.jwtVerify(token, secretKey, {
    algorithms: ['HS256'],
    audience: ['authenticated', 'anon'],
    issuer,
  });

  const jwtPayload = payload as unknown as JWTPayload;

  return {
    id: jwtPayload.sub,
    email: jwtPayload.email,
    role: jwtPayload.role,
  };
}

// Auth middleware - validates JWT and sets user in context
export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' }, 401);
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  const jwtSecret = getEnv(c, 'JWT_SECRET');
  const projectRef = getEnv(c, 'SUPABASE_PROJECT_REF');

  if (!jwtSecret) {
    console.error('JWT_SECRET not configured');
    return c.json({ error: 'Server configuration error', code: 'SERVER_ERROR' }, 500);
  }

  if (!projectRef) {
    console.error('SUPABASE_PROJECT_REF not configured');
    return c.json({ error: 'Server configuration error', code: 'SERVER_ERROR' }, 500);
  }

  const issuer = `https://${projectRef}.supabase.co/auth/v1`;

  try {
    const user = await verifyJWT(token, jwtSecret, issuer);
    c.set('user', user);
    c.set('accessToken', token);
    await next();
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      return c.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, 401);
    }
    if (error instanceof jose.errors.JWTInvalid || error instanceof jose.errors.JWTClaimValidationFailed) {
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
  const projectRef = getEnv(c, 'SUPABASE_PROJECT_REF');

  if (!jwtSecret || !projectRef) {
    await next();
    return;
  }

  const issuer = `https://${projectRef}.supabase.co/auth/v1`;

  try {
    const user = await verifyJWT(token, jwtSecret, issuer);
    c.set('user', user);
    c.set('accessToken', token);
  } catch {
    // Ignore errors for optional auth
  }

  await next();
});

// Helper to get current user from context (throws 401 if not authenticated)
export const requireUser = (c: { get: (key: 'user') => AuthUser | undefined }): AuthUser => {
  const user = c.get('user');
  if (!user) {
    throw new HTTPException(401, { message: 'User not authenticated' });
  }
  return user;
};
