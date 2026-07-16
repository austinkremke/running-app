import { formatAuthError } from '../authErrorFormatting';

describe('formatAuthError', () => {
  it('rewrites invalid credentials into a friendlier message', () => {
    expect(formatAuthError('Invalid login credentials')).toBe('Invalid email or password.');
  });

  it('rewrites duplicate signup into a friendlier message', () => {
    expect(formatAuthError('User already registered')).toBe(
      'An account with this email already exists. Sign in instead.',
    );
  });

  it('rewrites the short-password error into a friendlier message', () => {
    expect(formatAuthError('Password should be at least 6 characters.')).toBe(
      'Password must be at least 6 characters.',
    );
  });

  it('rewrites an expired/invalid OTP code into a friendlier message', () => {
    expect(formatAuthError('Token has expired or is invalid')).toBe(
      'That code is incorrect or has expired. Request a new one.',
    );
  });

  it('rewrites an OTP resend rate-limit error into a friendlier message', () => {
    expect(
      formatAuthError('For security purposes, you can only request this after 45 seconds.'),
    ).toBe('Please wait a moment before requesting another code.');
  });

  it('passes through unrecognized Supabase error messages unchanged', () => {
    expect(formatAuthError('Email rate limit exceeded')).toBe('Email rate limit exceeded');
  });
});
