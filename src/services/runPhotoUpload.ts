import { supabase } from './supabase';

export type RunPhotoPickResult = { canceled: true } | { canceled: false; uri: string };

export async function pickRunPhotoUri(source: 'camera' | 'library'): Promise<RunPhotoPickResult> {
  const ImagePicker = await import('expo-image-picker');

  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return { canceled: true };
    }

    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled || !result.assets[0]?.uri) {
      return { canceled: true };
    }
    return { canceled: false, uri: result.assets[0].uri };
  }

  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
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

export async function uploadRunPhoto(
  userId: string,
  activityId: string,
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
  // file response — upload raw bytes instead, same as profileAvatar.ts.
  const arrayBuffer = await response.arrayBuffer();
  const mimeType = response.headers.get('content-type') || 'image/jpeg';
  const extension = extensionForMimeType(mimeType);
  const storagePath = `${userId}/${activityId}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('run-photos')
    .upload(storagePath, arrayBuffer, {
      upsert: true,
      contentType: mimeType,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from('run-photos').getPublicUrl(storagePath);
  return data.publicUrl;
}
