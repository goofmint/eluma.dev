/**
 * Database client abstraction
 *
 * In Node.js mode (docker-compose): Uses pg library for direct PostgreSQL access
 * In Workers mode (production): Uses Supabase client for PostgREST access
 */

import type { Context } from 'hono';
import type { AppEnv } from '../types';
import { getEnv } from './supabase';

/**
 * Check if we're running in Node.js environment
 */
export function isNodeEnv(): boolean {
  return typeof process !== 'undefined' && process.versions?.node !== undefined;
}

/**
 * Database client for direct PostgreSQL access (Node.js mode)
 */
export interface DbClient {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>;
  close(): Promise<void>;
}

/**
 * PostgreSQL client for Node.js environment
 */
async function createPgClient(connectionString: string): Promise<DbClient> {
  // Dynamic import to avoid bundling pg in Workers
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString });

  return {
    async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
      const result = await pool.query(sql, params);
      return result.rows as T[];
    },

    async queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
      const result = await pool.query(sql, params);
      return (result.rows[0] as T) || null;
    },

    async close(): Promise<void> {
      await pool.end();
    },
  };
}

/**
 * Get database client from context
 */
export async function getDbClient(c: Context<AppEnv>): Promise<DbClient> {
  const databaseUrl = getEnv(c, 'DATABASE_URL');

  if (isNodeEnv() && databaseUrl) {
    return createPgClient(databaseUrl);
  }

  throw new Error('Database connection not available. Set DATABASE_URL for Node.js mode.');
}

/**
 * Set auth context for RLS (for future use with direct SQL)
 * This sets the JWT claims in the database session so RLS policies can use auth.uid()
 */
export async function setAuthContext(
  client: DbClient,
  userId: string
): Promise<void> {
  // Set the role to authenticated and the user ID for RLS
  await client.query('SET ROLE authenticated');
  await client.query(
    `SET request.jwt.claim.sub = '${userId}'`
  );
}
