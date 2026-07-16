import { sha256 } from 'js-sha256';

/** Pure OAuth helper logic, kept dependency-free (no react-native/supabase imports) so it's unit-testable under plain Node/Jest. */

export function formatProviderAuthError(message: string): string {
  if (
    message.includes('Passed nonce and nonce in id_token') ||
    message.includes('passed nonce and nonce in id_token') ||
    message.includes('Nonces mismatch')
  ) {
    return `${message} Enable "Skip nonce check" for Google in Supabase → Authentication → Providers → Google, then try again.`;
  }
  return message;
}

export function createAppleNonce(): { rawNonce: string; hashedNonce: string } {
  const rawNonce =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return { rawNonce, hashedNonce: sha256(rawNonce) };
}

const CANCELLATION_CODES = new Set(['ERR_REQUEST_CANCELED', 'ERR_CANCELED']);

/**
 * True when a rejected Apple/Google sign-in was the user backing out, not a
 * real failure. Native errors don't reliably carry a matching `.code`
 * (e.g. Apple's ASAuthorizationError sometimes only sets a "canceled"
 * message), so this checks both.
 */
export function isSignInCancellationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const code = 'code' in error ? String((error as { code: unknown }).code) : '';
  if (CANCELLATION_CODES.has(code)) return true;

  const message = 'message' in error ? String((error as { message: unknown }).message) : '';
  return /cancel/i.test(message);
}

export function displayNameFromAppleCredential(
  fullName: {
    givenName: string | null;
    familyName: string | null;
  } | null,
): string | null {
  if (!fullName) return null;
  const parts = [fullName.givenName, fullName.familyName].filter(Boolean);
  const name = parts.join(' ').trim();
  return name || null;
}
