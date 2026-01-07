/**
 * Database client abstraction
 *
 * Workers mode (production): Uses Hyperdrive for connection pooling
 * Node.js mode (development): Uses pg library with singleton pattern
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
 * Database client for direct PostgreSQL access
 */
export interface DbClient {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>;
  close(): Promise<void>;
}

// Singleton instance for Node.js environment
let pgClientInstance: DbClient | null = null;

/**
 * PostgreSQL client creator
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
 *
 * - Workers environment: Uses Hyperdrive (new client per request, pooling handled by Hyperdrive)
 * - Node.js environment: Uses singleton pattern to reuse connection pool
 */
export async function getDbClient(c: Context<AppEnv>): Promise<DbClient> {
  // Workers environment: Use Hyperdrive binding
  if (c.env?.HYPERDRIVE) {
    return createPgClient(c.env.HYPERDRIVE.connectionString);
  }

  // Node.js development environment: Use singleton pattern
  if (isNodeEnv()) {
    const databaseUrl = getEnv(c, 'DATABASE_URL');
    if (databaseUrl) {
      if (!pgClientInstance) {
        pgClientInstance = await createPgClient(databaseUrl);
      }
      return pgClientInstance;
    }
  }

  throw new Error(
    'Database connection not available. Set HYPERDRIVE binding for Workers or DATABASE_URL for Node.js.'
  );
}

/**
 * Set auth context for RLS (for future use with direct SQL)
 * This sets the JWT claims in the database session so RLS policies can use auth.uid()
 */
export async function setAuthContext(
  client: DbClient,
  userId: string
): Promise<void> {
  // Use set_config() with parameterized query to prevent SQL injection
  // set_config(setting_name, new_value, is_local)
  // is_local = true means the setting only applies to the current transaction
  await client.query('SET ROLE authenticated');
  await client.query('SELECT set_config($1, $2, true)', [
    'request.jwt.claim.sub',
    userId,
  ]);
}
