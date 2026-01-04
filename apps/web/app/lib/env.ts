// Environment configuration
export interface Env {
  VITE_API_URL: string;
  VITE_AUTH_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

// Get environment variables (works in both server and client)
export function getEnv(): Env {
  return {
    VITE_API_URL: import.meta.env.VITE_API_URL || 'https://eluma.test/api',
    VITE_AUTH_URL: import.meta.env.VITE_AUTH_URL || 'https://eluma.test/auth',
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  };
}
