// Environment configuration
export interface Env {
  VITE_API_URL: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

// Get environment variables (works in both server and client)
export function getEnv(): Env {
  return {
    // Use relative paths as default (works with nginx reverse proxy)
    VITE_API_URL: import.meta.env.VITE_API_URL || '/api',
    // Supabase URL - use full URL for auth (GoTrue needs absolute URL)
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  };
}
