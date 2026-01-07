import type { Session, User } from '@supabase/supabase-js';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase, signIn, signOut, signUp } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip on server
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const supabase = getSupabase();

    // Debug: check localStorage (dev only, never log actual token)
    if (import.meta.env.DEV) {
      const storageKey = `sb-${new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
      console.log('[Auth] Storage key present:', !!localStorage.getItem(storageKey));
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      console.log('[Auth] getSession result:', sess ? 'has session' : 'no session');
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignUp = async (email: string, password: string) => {
    await signUp(email, password);
  };

  const handleSignIn = async (email: string, password: string) => {
    const result = await signIn(email, password);
    setSession(result.session);
    setUser(result.user);
  };

  const handleSignOut = async () => {
    await signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp: handleSignUp,
        signIn: handleSignIn,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
