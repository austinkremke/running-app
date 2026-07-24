import { buildNextRankGoal } from '../nextRankGoal';
import type { ResolvedRankTier } from '../../../types/rank';

const TIERS: ResolvedRankTier[] = [
  { id: 'bronze', displayName: 'Bronze Runner', subtitle: 'Start', icon: 'shield-bronze', minRating: 0 },
  { id: 'silver', displayName: 'Silver Strider', subtitle: 'Mid', icon: 'shield-silver', minRating: 1200 },
  { id: 'gold', displayName: 'Gold Grinder', subtitle: 'High', icon: 'shield-gold', minRating: 1400 },
  { id: 'legend', displayName: 'Legend', subtitle: 'Top', icon: 'shield-legend', minRating: 1800 },
];

describe('buildNextRankGoal', () => {
  it('measures bronze progress from the starting rating (1000), not the tier floor (0)', () => {
    const goal = buildNextRankGoal(1000, TIERS);

    expect(goal).toEqual({
      nextTierId: 'silver',
      nextTierTitle: 'SILVER STRIDER',
      pointsNeeded: 200,
      progress: 0,
      currentRating: 1000,
      nextTierMinRating: 1200,
      currentTierMinRating: 1000,
    });
  });

  it('clamps bronze progress to 0 at or below the starting rating', () => {
    expect(buildNextRankGoal(800, TIERS)?.progress).toBe(0);
  });

  it('shows partial bronze progress between the starting rating and silver', () => {
    const goal = buildNextRankGoal(1100, TIERS);
    expect(goal?.progress).toBeCloseTo(100 / 200, 5);
  });

  it('measures progress within the current tier bracket', () => {
    const goal = buildNextRankGoal(1300, TIERS);

    expect(goal?.nextTierId).toBe('gold');
    expect(goal?.pointsNeeded).toBe(100);
    expect(goal?.progress).toBeCloseTo(0.5, 5);
  });

  it('returns null at the top tier', () => {
    expect(buildNextRankGoal(1900, TIERS)).toBeNull();
  });
});
