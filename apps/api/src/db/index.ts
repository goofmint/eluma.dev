import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Context } from 'hono';
import pg from 'pg';
import { getEnv } from '../lib/supabase';
import type { AppEnv } from '../types';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

let pool: pg.Pool | null = null;

function getPool(connectionString: string): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({ connectionString });
  }
  return pool;
}

export function getDb(c: Context<AppEnv>): Database {
  const databaseUrl = getEnv(c, 'DATABASE_URL');
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }
  const p = getPool(databaseUrl);
  return drizzle(p, { schema });
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Set auth context for RLS (Row Level Security)
 * Uses set_config() with parameterized query to safely set JWT claims
 * This allows RLS policies to use auth.uid()
 */
export async function setAuthContext(
  db: Database,
  userId: string
): Promise<void> {
  // Use set_config() with parameterized query to prevent SQL injection
  // set_config(setting_name, new_value, is_local)
  // is_local = true means the setting only applies to the current transaction
  await db.execute(sql`SET ROLE authenticated`);
  await db.execute(sql`SELECT set_config('request.jwt.claim.sub', ${userId}, true)`);
}

export * from './schema';
