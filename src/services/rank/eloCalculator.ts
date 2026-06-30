const DEFAULT_K_FACTOR = 32;

export function eloExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

export function eloRatingDelta(
  playerRating: number,
  opponentRating: number,
  score: 0 | 1,
  kFactor = DEFAULT_K_FACTOR,
): number {
  const expected = eloExpectedScore(playerRating, opponentRating);
  return Math.round(kFactor * (score - expected));
}

export function applyEloMatchResult(
  winnerRating: number,
  loserRating: number,
  kFactor = DEFAULT_K_FACTOR,
): { winnerRating: number; loserRating: number; winnerDelta: number; loserDelta: number } {
  const winnerDelta = eloRatingDelta(winnerRating, loserRating, 1, kFactor);
  const loserDelta = eloRatingDelta(loserRating, winnerRating, 0, kFactor);

  return {
    winnerRating: Math.max(0, winnerRating + winnerDelta),
    loserRating: Math.max(0, loserRating + loserDelta),
    winnerDelta,
    loserDelta,
  };
}
