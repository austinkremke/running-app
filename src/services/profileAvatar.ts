import { supabase } from './supabase';

export type ProfilePhotoPickResult =
  | { canceled: true }
  | { canceled: false; uri: string };

export async function pickProfilePhotoUri(): Promise<ProfilePhotoPickResult> {
  const ImagePicker = await import('expo-image-picker');

  // PHPicker (allowsEditing: false) does not require a permission prompt on iOS 14+.
  // Legacy UIImagePicker (allowsEditing: true) needs NSPhotoLibraryUsageDescription in Info.plist.
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

function isHttpUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

export function avatarUrlFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  if (!metadata) {
    return null;
  }

  for (const key of ['avatar_url', 'picture', 'photo'] as const) {
    const value = metadata[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed && isHttpUrl(trimmed)) {
        return trimmed;
      }
    }
  }

  return null;
}

export function initialsFromDisplayName(name: string | null | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed) {
    return 'U';
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'U';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export async function syncProfileAvatar(
  userId: string,
  avatarUrl: string | null | undefined,
): Promise<void> {
  if (!supabase) {
    return;
  }

  const trimmed = avatarUrl?.trim();
  if (!trimmed || !isHttpUrl(trimmed)) {
    return;
  }

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: trimmed })
    .eq('id', userId);

  if (error) {
    throw error;
  }
}

export async function syncProfileAvatarIfMissing(
  userId: string,
  avatarUrl: string | null | undefined,
): Promise<void> {
  if (!supabase) {
    return;
  }

  const trimmed = avatarUrl?.trim();
  if (!trimmed || !isHttpUrl(trimmed)) {
    return;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data?.avatar_url) {
    return;
  }

  await syncProfileAvatar(userId, trimmed);
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

export async function uploadProfileAvatar(userId: string, localUri: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const response = await fetch(localUri);
  if (!response.ok) {
    throw new Error('Could not read the selected photo.');
  }

  const blob = await response.blob();
  const mimeType = blob.type || 'image/jpeg';
  const extension = extensionForMimeType(mimeType);
  const storagePath = `${userId}/avatar-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from('avatars').upload(storagePath, blob, {
    upsert: true,
    contentType: mimeType,
  });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(storagePath);
  const publicUrl = data.publicUrl;

  await syncProfileAvatar(userId, publicUrl);
  return publicUrl;
}
