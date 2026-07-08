import { supabase } from './supabase';

export type TeamLogoPickResult = { canceled: true } | { canceled: false; uri: string };

export async function pickTeamLogoUri(): Promise<TeamLogoPickResult> {
  const ImagePicker = await import('expo-image-picker');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]?.uri) {
    return { canceled: true };
  }

  return { canceled: false, uri: result.assets[0].uri };
}

function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
}

/**
 * Uploads under the uploading user's own storage folder (the "avatars"
 * bucket only grants writes scoped to auth.uid()) — write access to the
 * team itself is gated separately, at the update_team RPC layer, by
 * leader/co-leader role.
 */
export async function uploadTeamLogo(
  userId: string,
  teamId: string,
  localUri: string,
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const response = await fetch(localUri);
  if (!response.ok) {
    throw new Error('Could not read the selected photo.');
  }

  // React Native's fetch/Blob polyfill can't construct a Blob from a local
  // file response ("Creating blobs from Array buffer and arraybufferview
  // are not supported") — upload raw bytes instead, same as activitySync.ts.
  const arrayBuffer = await response.arrayBuffer();
  const mimeType = response.headers.get('content-type') || 'image/jpeg';
  const extension = extensionForMimeType(mimeType);
  const storagePath = `${userId}/team-${teamId}-logo-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(storagePath, arrayBuffer, {
      upsert: true,
      contentType: mimeType,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(storagePath);
  return data.publicUrl;
}
