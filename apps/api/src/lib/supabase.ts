import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import type { Context } from 'hono';
import type { AppEnv, Bindings } from '../types';

// Helper to get env variable from Workers (c.env) or Node.js (process.env)
export const getEnv = (
  c: Context<AppEnv> | { env?: Bindings },
  key: keyof Bindings
): string | undefined => {
  const env = 'env' in c ? c.env : undefined;
  return env?.[key] || (typeof process !== 'undefined' ? process.env[key] : undefined);
};

// Get required env variable or throw
export const requireEnv = (
  c: Context<AppEnv> | { env?: Bindings },
  key: keyof Bindings
): string => {
  const value = getEnv(c, key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

// Create Supabase client with user's JWT for RLS
export const createSupabaseClient = (
  c: Context<AppEnv>,
  accessToken?: string
): SupabaseClient => {
  const supabaseUrl = requireEnv(c, 'SUPABASE_URL');
  const supabaseKey = requireEnv(c, 'SUPABASE_ANON_KEY');

  const options = accessToken
    ? {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    : undefined;

  return createClient(supabaseUrl, supabaseKey, options);
};

// Create Supabase admin client (bypasses RLS)
export const createSupabaseAdmin = (c: Context<AppEnv>): SupabaseClient => {
  const supabaseUrl = requireEnv(c, 'SUPABASE_URL');
  const serviceKey = requireEnv(c, 'SUPABASE_SERVICE_KEY');

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
