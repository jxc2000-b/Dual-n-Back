import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { guestStorage, setStorageAdapter } from '@storage/index';
import { SupabaseAdapter } from '@storage/supabaseAdapter';
import { isSupabaseConfigured, supabase } from './supabaseClient';

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const applySession = useCallback(async (nextSession: Session | null) => {
    setStorageForSession(nextSession);
    try {
      await migrateGuestData(nextSession);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[auth] unable to migrate guest data to Supabase', err);
    }
    setSession(nextSession);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setStorageAdapter(guestStorage);
      setLoading(false);
      return;
    }

    let cancelled = false;

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      void applySession(data.session).finally(() => {
        if (!cancelled) setLoading(false);
      });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [applySession]);

  const signInWithEmail = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Supabase is not configured.');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setStorageAdapter(guestStorage);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    configured: isSupabaseConfigured,
    loading,
    session,
    user: session?.user ?? null,
    signInWithEmail,
    signOut,
  }), [loading, session, signInWithEmail, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

function setStorageForSession(session: Session | null): void {
  if (!supabase || !session?.user) {
    setStorageAdapter(guestStorage);
    return;
  }

  setStorageAdapter(new SupabaseAdapter(supabase, session.user.id));
}

async function migrateGuestData(session: Session | null): Promise<void> {
  if (!supabase || !session?.user) return;

  const key = `dnb.supabase.migrated.${session.user.id}`;
  if (localStorage.getItem(key) === '1') return;

  const adapter = new SupabaseAdapter(supabase, session.user.id);
  const [settings, sets] = await Promise.all([
    guestStorage.loadSettings(),
    guestStorage.listSets(),
  ]);

  if (settings) await adapter.saveSettings(settings);
  for (const set of sets) {
    await adapter.appendSet(set);
  }
  if (sets.length > 0) await guestStorage.clearSets();
  localStorage.setItem(key, '1');
}
