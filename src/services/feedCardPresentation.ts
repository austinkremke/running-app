import type { PostRunSummary } from '../mock';

export function photoUrlFromPost(
  postPhotoUrl: string | null | undefined,
  summary: PostRunSummary | null,
): string | undefined {
  if (postPhotoUrl) {
    return postPhotoUrl;
  }

  const summaryPhoto = summary?.photos?.[0];
  return summaryPhoto || undefined;
}
