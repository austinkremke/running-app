import { supabase } from './supabase';

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
