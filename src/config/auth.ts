const googleIosClientId = (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '').trim();
const googleWebClientId = (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '').trim();

export const isGoogleAuthConfigured = Boolean(googleIosClientId && googleWebClientId);

export function getGoogleClientIds(): { iosClientId: string; webClientId: string } {
  if (!isGoogleAuthConfigured) {
    throw new Error(
      'Google Sign-In is not configured. Add EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env.',
    );
  }

  return { iosClientId: googleIosClientId, webClientId: googleWebClientId };
}
