import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';

import { flushPendingActivitySync } from '../services/activitySync';
import {
  fetchUserGameState,
  type UserGameState,
} from '../services/profileService';
import {
  OAuthAuthError,
  signInWithAppleNative,
  signInWithGoogleNative,
  signOutOAuthProviders,
} from '../services/oauthAuth';
import { isSupabaseConfigured, supabase } from '../services/supabase';

type AuthContextValue = {
  session: Session | null;
  gameState: UserGameState | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshGameState: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function formatAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password.';
  }
  if (message.includes('User already registered')) {
    return 'An account with this email already exists. Sign in instead.';
  }
  if (message.includes('Password should be at least')) {
    return 'Password must be at least 6 characters.';
  }
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [gameState, setGameState] = useState<UserGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const refreshGameState = useCallback(async () => {
    if (!supabase || !session?.user) {
      setGameState(null);
      return;
    }

    const state = await fetchUserGameState(session.user.id);
    setGameState(state);
  }, [session]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setGameState(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setGameState(null);
      return;
    }

    refreshGameState().catch((error: unknown) => {
      console.error('Failed to load profile', error);
      setAuthError(
        error instanceof Error ? error.message : 'Could not load your profile. Try again.',
      );
    });

    flushPendingActivitySync(session.user.id).catch((error) => {
      console.warn('Failed to flush pending activity sync', error);
    });
  }, [session, refreshGameState]);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName: string) => {
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }

      setAuthError(null);
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = displayName.trim() || trimmedEmail.split('@')[0] || 'runner';

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { display_name: trimmedName },
        },
      });

      if (error) {
        const message = formatAuthError(error.message);
        setAuthError(message);
        throw new Error(message);
      }

      if (!data.session) {
        const message = 'Check your email to confirm your account, then sign in.';
        setAuthError(message);
        throw new Error(message);
      }
    },
    [],
  );

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      const message = formatAuthError(error.message);
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithAppleNative();
    } catch (error) {
      if (error instanceof OAuthAuthError && error.code === 'cancelled') {
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Apple sign-in failed. Try again.';
      setAuthError(message);
      throw error;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithGoogleNative();
    } catch (error) {
      if (error instanceof OAuthAuthError && error.code === 'cancelled') {
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Google sign-in failed. Try again.';
      setAuthError(message);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;

    setAuthError(null);
    await signOutOAuthProviders();
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      gameState,
      loading,
      authError,
      clearAuthError,
      signUpWithEmail,
      signInWithEmail,
      signInWithApple,
      signInWithGoogle,
      signOut,
      refreshGameState,
    }),
    [
      session,
      gameState,
      loading,
      authError,
      clearAuthError,
      signUpWithEmail,
      signInWithEmail,
      signInWithApple,
      signInWithGoogle,
      signOut,
      refreshGameState,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useUserId(): string | null {
  const { session } = useAuth();
  return session?.user?.id ?? null;
}

export { isSupabaseConfigured };
