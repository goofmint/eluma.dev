// Environment configuration
export interface Env {
  VITE_API_URL: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

// Get environment variables (works in both server and client)
export function getEnv(): Env {
  return {
    VITE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8787',
    VITE_SUPABASE_URL:
      import.meta.env.VITE_SUPABASE_URL || 'http://localhost:8000',
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  };
}
