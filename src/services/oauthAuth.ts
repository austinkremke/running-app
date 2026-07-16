import { Platform } from 'react-native';

import { getGoogleClientIds, isGoogleAuthConfigured } from '../config/auth';
import { syncProfileAvatar } from './profileAvatar';
import { supabase } from './supabase';
import {
  createAppleNonce,
  displayNameFromAppleCredential,
  formatProviderAuthError,
  isSignInCancellationError,
} from './oauthAuthHelpers';

export {
  createAppleNonce,
  displayNameFromAppleCredential,
  formatProviderAuthError,
  isSignInCancellationError,
};

export class OAuthAuthError extends Error {
  constructor(
    message: string,
    readonly code: 'cancelled' | 'not_configured' | 'unavailable' | 'provider' = 'provider',
  ) {
    super(message);
    this.name = 'OAuthAuthError';
  }
}

let googleConfigured = false;

function ensureSupabase() {
  if (!supabase) {
    throw new OAuthAuthError('Supabase is not configured.', 'not_configured');
  }
  return supabase;
}

function configureGoogleSignIn(GoogleSignin: {
  configure: (options: {
    iosClientId: string;
    webClientId: string;
    offlineAccess: boolean;
  }) => void;
}): void {
  if (googleConfigured || !isGoogleAuthConfigured) return;

  const { iosClientId, webClientId } = getGoogleClientIds();
  GoogleSignin.configure({
    iosClientId,
    webClientId,
    offlineAccess: false,
  });
  googleConfigured = true;
}

async function syncProfileDisplayName(userId: string, displayName: string): Promise<void> {
  const client = ensureSupabase();
  const trimmed = displayName.trim();
  if (!trimmed) return;

  await client.auth.updateUser({ data: { display_name: trimmed } });
  await client.from('profiles').update({ display_name: trimmed }).eq('id', userId);
}

export async function signInWithAppleNative(): Promise<void> {
  ensureSupabase();

  if (Platform.OS !== 'ios') {
    throw new OAuthAuthError('Sign in with Apple is only available on iOS.', 'unavailable');
  }

  const AppleAuthentication = await import('expo-apple-authentication');

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new OAuthAuthError(
      'Sign in with Apple is not available on this device. Use a physical iOS device or TestFlight build.',
      'unavailable',
    );
  }

  const { rawNonce, hashedNonce } = createAppleNonce();

  let credential: Awaited<ReturnType<typeof AppleAuthentication.signInAsync>>;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error) {
    if (isSignInCancellationError(error)) {
      throw new OAuthAuthError('Sign in cancelled.', 'cancelled');
    }
    throw error;
  }

  if (!credential.identityToken) {
    throw new OAuthAuthError('Apple did not return an identity token.');
  }

  const client = ensureSupabase();
  const { data, error } = await client.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });

  if (error) {
    throw new OAuthAuthError(formatProviderAuthError(error.message));
  }

  const displayName = displayNameFromAppleCredential(credential.fullName);
  if (displayName && data.user) {
    await syncProfileDisplayName(data.user.id, displayName).catch((profileError) => {
      console.warn('Failed to sync Apple display name', profileError);
    });
  }
}

export async function signInWithGoogleNative(): Promise<void> {
  ensureSupabase();

  if (!isGoogleAuthConfigured) {
    throw new OAuthAuthError(
      'Google Sign-In is not configured. Add Google client IDs to .env and rebuild the app.',
      'not_configured',
    );
  }

  const {
    GoogleSignin,
    isCancelledResponse,
    isSuccessResponse,
    statusCodes,
  } = await import('@react-native-google-signin/google-signin');

  configureGoogleSignIn(GoogleSignin);

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  let response;
  try {
    response = await GoogleSignin.signIn();
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code: string }).code)
        : '';

    if (code === statusCodes.SIGN_IN_CANCELLED) {
      throw new OAuthAuthError('Sign in cancelled.', 'cancelled');
    }
    if (code === statusCodes.IN_PROGRESS) {
      throw new OAuthAuthError('Google sign-in is already in progress.');
    }
    throw error;
  }

  if (isCancelledResponse(response)) {
    throw new OAuthAuthError('Sign in cancelled.', 'cancelled');
  }

  if (!isSuccessResponse(response)) {
    throw new OAuthAuthError('Google sign-in did not complete.');
  }

  let idToken = response.data.idToken;
  let accessToken: string | undefined;
  if (!idToken) {
    const tokens = await GoogleSignin.getTokens();
    idToken = tokens.idToken;
    accessToken = tokens.accessToken;
  } else {
    try {
      const tokens = await GoogleSignin.getTokens();
      accessToken = tokens.accessToken;
    } catch {
      // access_token is optional unless the id_token includes at_hash.
    }
  }

  if (!idToken) {
    throw new OAuthAuthError('Google did not return an identity token.');
  }

  const client = ensureSupabase();
  const { data, error } = await client.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
    ...(accessToken ? { access_token: accessToken } : {}),
  });

  if (error) {
    throw new OAuthAuthError(formatProviderAuthError(error.message));
  }

  const displayName = response.data.user.name?.trim();
  const photoUrl = response.data.user.photo?.trim();

  if (data.user) {
    if (displayName) {
      await syncProfileDisplayName(data.user.id, displayName).catch((profileError) => {
        console.warn('Failed to sync Google display name', profileError);
      });
    }

    if (photoUrl) {
      await client.auth.updateUser({ data: { avatar_url: photoUrl, picture: photoUrl } });
      await syncProfileAvatar(data.user.id, photoUrl).catch((profileError) => {
        console.warn('Failed to sync Google avatar', profileError);
      });
    }
  }
}

export async function signOutOAuthProviders(): Promise<void> {
  if (!isGoogleAuthConfigured) return;

  try {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    configureGoogleSignIn(GoogleSignin);
    await GoogleSignin.signOut();
  } catch {
    // Ignore — user may not have signed in with Google.
  }
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;

  try {
    const AppleAuthentication = await import('expo-apple-authentication');
    return AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}
