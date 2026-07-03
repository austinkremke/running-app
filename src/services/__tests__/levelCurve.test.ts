import { cumulativeXpForLevel, levelFromTotalXp, xpForLevelUp } from '../levelCurve';

// Parity fixtures for public.level_from_total_xp(bigint) (supabase/migrations/20250620000001_achievements.sql),
// used server-side by achievement evaluation and feature-gate checks (20250702000001).
// If these thresholds change, the SQL curve must change with them (and vice versa).
const LEVEL_THRESHOLDS: Array<[level: number, totalXp: number]> = [
  [2, 131],
  [3, 274],
  [5, 598],
  [10, 1703],
  [25, 10044],
  [50, 97687],
  [98, 6203456],
];

describe('levelCurve', () => {
  it('matches the pinned threshold table (SQL parity fixtures)', () => {
    for (const [level, totalXp] of LEVEL_THRESHOLDS) {
      expect(cumulativeXpForLevel(level)).toBe(totalXp);
    }
  });

  it('promotes exactly at each threshold and not one XP earlier', () => {
    for (const [level, totalXp] of LEVEL_THRESHOLDS) {
      expect(levelFromTotalXp(totalXp)).toBe(level);
      expect(levelFromTotalXp(totalXp - 1)).toBe(level - 1);
    }
  });

  it('starts at level 1 with zero XP', () => {
    expect(levelFromTotalXp(0)).toBe(1);
  });

  it('caps at level 98', () => {
    expect(levelFromTotalXp(Number.MAX_SAFE_INTEGER)).toBe(98);
  });

  it('per-level step follows round(120 * 1.09^L)', () => {
    expect(xpForLevelUp(1)).toBe(131);
    expect(xpForLevelUp(10)).toBe(284);
  });
});
