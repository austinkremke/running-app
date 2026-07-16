import {
  createAppleNonce,
  displayNameFromAppleCredential,
  formatProviderAuthError,
  isSignInCancellationError,
} from '../oauthAuthHelpers';

describe('createAppleNonce', () => {
  it('returns a raw nonce and its sha256 hash, and they differ', () => {
    const { rawNonce, hashedNonce } = createAppleNonce();

    expect(rawNonce).toBeTruthy();
    expect(hashedNonce).toBeTruthy();
    expect(hashedNonce).not.toBe(rawNonce);
    expect(hashedNonce).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates a different nonce on every call', () => {
    const first = createAppleNonce();
    const second = createAppleNonce();

    expect(first.rawNonce).not.toBe(second.rawNonce);
    expect(first.hashedNonce).not.toBe(second.hashedNonce);
  });
});

describe('displayNameFromAppleCredential', () => {
  it('joins given and family name', () => {
    expect(displayNameFromAppleCredential({ givenName: 'Austin', familyName: 'Kremke' })).toBe(
      'Austin Kremke',
    );
  });

  it('handles a missing family name', () => {
    expect(displayNameFromAppleCredential({ givenName: 'Austin', familyName: null })).toBe(
      'Austin',
    );
  });

  it('returns null when fullName is null (Apple only sends this on first sign-in)', () => {
    expect(displayNameFromAppleCredential(null)).toBeNull();
  });

  it('returns null when both name parts are empty', () => {
    expect(displayNameFromAppleCredential({ givenName: null, familyName: null })).toBeNull();
  });
});

describe('formatProviderAuthError', () => {
  it('appends a fix hint for a Google nonce mismatch error', () => {
    const result = formatProviderAuthError('Nonces mismatch');
    expect(result).toContain('Nonces mismatch');
    expect(result).toContain('Skip nonce check');
  });

  it('passes through unrelated error messages unchanged', () => {
    expect(formatProviderAuthError('Invalid login credentials')).toBe(
      'Invalid login credentials',
    );
  });
});

describe('isSignInCancellationError', () => {
  it('matches by the expected Apple/Google cancellation codes', () => {
    expect(isSignInCancellationError({ code: 'ERR_REQUEST_CANCELED' })).toBe(true);
    expect(isSignInCancellationError({ code: 'ERR_CANCELED' })).toBe(true);
  });

  it('matches Apple\'s raw ASAuthorizationError message even without a matching code', () => {
    expect(
      isSignInCancellationError({
        code: '1001',
        message: 'The user canceled the authorization attempt.',
      }),
    ).toBe(true);
  });

  it('is case-insensitive on the message fallback', () => {
    expect(isSignInCancellationError({ message: 'User CANCELLED the request' })).toBe(true);
  });

  it('does not treat a real failure as a cancellation', () => {
    expect(isSignInCancellationError({ code: 'ERR_INVALID_RESPONSE', message: 'Network error' })).toBe(
      false,
    );
  });

  it('handles non-object and empty input safely', () => {
    expect(isSignInCancellationError(null)).toBe(false);
    expect(isSignInCancellationError(undefined)).toBe(false);
    expect(isSignInCancellationError('some string')).toBe(false);
    expect(isSignInCancellationError({})).toBe(false);
  });
});
