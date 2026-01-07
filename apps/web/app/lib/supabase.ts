import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from './env';

let supabaseClient: SupabaseClient | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getSupabase(): SupabaseClient {
  if (!isBrowser()) {
    throw new Error('Supabase client can only be used in the browser');
  }

  if (supabaseClient) {
    return supabaseClient;
  }

  const env = getEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase configuration missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseClient;
}

// Auth helper functions - all browser-only
export async function signUp(email: string, password: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
  if (!isBrowser()) return null;
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser(): Promise<User | null> {
  if (!isBrowser()) return null;
  const supabase = getSupabase();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  if (!isBrowser()) {
    return { unsubscribe: () => {} };
  }
  const supabase = getSupabase();
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return data.subscription;
}

export async function getAccessToken(): Promise<string | null> {
  if (!isBrowser()) return null;
  const session = await getSession();
  return session?.access_token || null;
}
