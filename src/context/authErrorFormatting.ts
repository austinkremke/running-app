/** Pure error-message formatting, kept dependency-free so it's unit-testable under plain Node/Jest. */
export function formatAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password.';
  }
  if (message.includes('User already registered')) {
    return 'An account with this email already exists. Sign in instead.';
  }
  if (message.includes('Password should be at least')) {
    return 'Password must be at least 6 characters.';
  }
  if (message.includes('Token has expired or is invalid')) {
    return 'That code is incorrect or has expired. Request a new one.';
  }
  if (message.includes('For security purposes, you can only request this after')) {
    return 'Please wait a moment before requesting another code.';
  }
  return message;
}
