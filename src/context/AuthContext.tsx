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
import { formatAuthError } from './authErrorFormatting';

export { formatAuthError };

type AuthContextValue = {
  session: Session | null;
  gameState: UserGameState | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  sendEmailOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, code: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshGameState: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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

    if (__DEV__) {
      console.log(
        `[Run Off] EXPO_PUBLIC_DEV_XP_USER_ID=${session.user.id}`,
      );
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

  const sendEmailOtp = useCallback(async (email: string) => {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    setAuthError(null);
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = trimmedEmail.split('@')[0] || 'runner';

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        shouldCreateUser: true,
        data: { display_name: trimmedName },
      },
    });

    if (error) {
      const message = formatAuthError(error.message);
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const verifyEmailOtp = useCallback(async (email: string, code: string) => {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    setAuthError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'email',
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
      sendEmailOtp,
      verifyEmailOtp,
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
      sendEmailOtp,
      verifyEmailOtp,
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
