import { applyEloMatchResult, eloExpectedScore, eloRatingDelta } from '../eloCalculator';
import { mapRankTierRow, tierFromRating } from '../tierFromRating';
import type { ResolvedRankTier } from '../../../types/rank';

const TIERS: ResolvedRankTier[] = [
  { id: 'bronze', displayName: 'Bronze Runner', subtitle: 'Start', icon: 'shield-bronze', minRating: 0 },
  { id: 'silver', displayName: 'Silver Strider', subtitle: 'Mid', icon: 'shield-silver', minRating: 1200 },
  { id: 'gold', displayName: 'Gold Grinder', subtitle: 'High', icon: 'shield-gold', minRating: 1400 },
];

describe('eloExpectedScore', () => {
  it('returns 0.5 for equal ratings', () => {
    expect(eloExpectedScore(1000, 1000)).toBeCloseTo(0.5, 5);
  });

  it('favors the higher-rated player', () => {
    expect(eloExpectedScore(1200, 1000)).toBeGreaterThan(0.5);
    expect(eloExpectedScore(1000, 1200)).toBeLessThan(0.5);
  });
});

describe('applyEloMatchResult', () => {
  it('moves ratings in opposite directions for a win/loss', () => {
    const result = applyEloMatchResult(1000, 1000);

    expect(result.winnerDelta).toBeGreaterThan(0);
    expect(result.loserDelta).toBeLessThan(0);
    expect(result.winnerRating).toBe(1000 + result.winnerDelta);
    expect(result.loserRating).toBe(1000 + result.loserDelta);
  });

  it('awards fewer points when the favorite wins', () => {
    const favoriteWin = applyEloMatchResult(1400, 1000);
    const upsetWin = applyEloMatchResult(1000, 1400);

    expect(favoriteWin.winnerDelta).toBeLessThan(upsetWin.winnerDelta);
  });
});

describe('eloRatingDelta', () => {
  it('matches the winner branch of a tied match', () => {
    const winnerDelta = eloRatingDelta(1000, 1000, 1);
    const { winnerDelta: fromHelper } = applyEloMatchResult(1000, 1000);

    expect(winnerDelta).toBe(fromHelper);
  });
});

describe('tierFromRating', () => {
  it('returns bronze at the default rating', () => {
    expect(tierFromRating(1000, TIERS).id).toBe('bronze');
  });

  it('steps up at tier boundaries', () => {
    expect(tierFromRating(1199, TIERS).id).toBe('bronze');
    expect(tierFromRating(1200, TIERS).id).toBe('silver');
    expect(tierFromRating(1400, TIERS).id).toBe('gold');
  });

  it('maps database rows into resolved tiers', () => {
    const tier = mapRankTierRow({
      id: 'elite',
      display_name: 'Elite Runner',
      subtitle: 'Top tier athlete',
      icon: 'shield-elite',
      min_rating: 1600,
      sort_order: 4,
    });

    expect(tier.displayName).toBe('Elite Runner');
    expect(tier.minRating).toBe(1600);
  });
});
