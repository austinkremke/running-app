import { buildNextRankGoal } from '../nextRankGoal';
import type { ResolvedRankTier } from '../../../types/rank';

const TIERS: ResolvedRankTier[] = [
  { id: 'bronze', displayName: 'Bronze Runner', subtitle: 'Start', icon: 'shield-bronze', minRating: 0 },
  { id: 'silver', displayName: 'Silver Strider', subtitle: 'Mid', icon: 'shield-silver', minRating: 1200 },
  { id: 'gold', displayName: 'Gold Grinder', subtitle: 'High', icon: 'shield-gold', minRating: 1400 },
  { id: 'legend', displayName: 'Legend', subtitle: 'Top', icon: 'shield-legend', minRating: 1800 },
];

describe('buildNextRankGoal', () => {
  it('returns points and progress toward the next tier', () => {
    const goal = buildNextRankGoal(1000, TIERS);

    expect(goal).toEqual({
      nextTierId: 'silver',
      nextTierTitle: 'SILVER STRIDER',
      pointsNeeded: 200,
      progress: 1000 / 1200,
      currentRating: 1000,
      nextTierMinRating: 1200,
      currentTierMinRating: 0,
    });
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
