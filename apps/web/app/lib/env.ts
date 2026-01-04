// Environment configuration
export interface Env {
  VITE_API_URL: string;
  VITE_AUTH_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

// Get environment variables (works in both server and client)
export function getEnv(): Env {
  return {
    // Use relative paths as default (works with nginx reverse proxy)
    VITE_API_URL: import.meta.env.VITE_API_URL || '/api',
    VITE_AUTH_URL: import.meta.env.VITE_AUTH_URL || '/auth',
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  };
}
