const SHARE_BASE_URL = 'https://getrunoff.com';

/** feedPostId is the shared identifier the website's /share/run page looks up via get_public_run_share. */
export function buildRunShareUrl(feedPostId: string): string {
  return `${SHARE_BASE_URL}/share/run/${feedPostId}`;
}

export function buildMatchShareUrl(matchId: string): string {
  return `${SHARE_BASE_URL}/share/match/${matchId}`;
}
