import { buildAchievementXpGainEvent } from '../buildAchievementXpGainEvent';
import { buildCombinedXpGainEvent } from '../buildCombinedXpGainEvent';
import type { UnlockedAchievementPayload } from '../../achievementService';

const unlock: UnlockedAchievementPayload = {
  id: 'first_run',
  display_name: 'First Run',
  description: 'Complete your first synced run.',
  category: 'distance',
  tier: 'bronze',
  icon: 'footsteps',
  xp_reward: 100,
  unlocked_at: '2026-06-01T12:00:00.000Z',
};

describe('buildAchievementXpGainEvent', () => {
  it('builds an achievement-only XP event', () => {
    const event = buildAchievementXpGainEvent(5000, [unlock]);

    expect(event.source).toBe('achievement');
    expect(event.xpEarned).toBe(100);
    expect(event.startingLevel).toBeGreaterThan(0);
    expect(event.achievementSummary).toHaveLength(1);
    expect(event.breakdown).toEqual([
      {
        key: 'achievement',
        label: 'First Run',
        detail: 'Bronze · Distance',
        xp: 100,
      },
    ]);
  });

  it('sums XP across multiple unlocks', () => {
    const second: UnlockedAchievementPayload = {
      ...unlock,
      id: 'five_miles',
      display_name: '5 Miles',
      xp_reward: 150,
    };

    const event = buildAchievementXpGainEvent(5000, [unlock, second]);

    expect(event.xpEarned).toBe(250);
    expect(event.breakdown).toHaveLength(2);
    expect(event.achievementSummary).toHaveLength(2);
  });
});

describe('buildCombinedXpGainEvent', () => {
  it('merges run and achievement segments', () => {
    const event = buildCombinedXpGainEvent({
      beforeTotalXp: 5000,
      runSummary: {
        distance: '3.42 mi',
        duration: '28:14',
        pace: '8:15 /mi',
      },
      runBreakdown: [{ key: 'distance', label: 'Distance', detail: '3.42 mi', xp: 300 }],
      achievementUnlocks: [unlock],
    });

    expect(event.source).toBe('combined');
    expect(event.xpEarned).toBe(400);
    expect(event.runSummary?.distance).toBe('3.42 mi');
    expect(event.breakdown).toHaveLength(2);
    expect(event.breakdown[1]?.key).toBe('achievement');
  });
});
