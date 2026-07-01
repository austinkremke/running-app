import { buildPostRunXpGainEvent } from '../buildPostRunXpGainEvent';
import type { UnlockedAchievementPayload } from '../../achievementService';
import type { XpGainEvent } from '../../../types/progression';

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

const runEvent: XpGainEvent = {
  source: 'run',
  xpEarned: 300,
  startingLevel: 5,
  startingXp: 1200,
  xpToNextLevel: 2000,
  runSummary: {
    distance: '3.42 mi',
    duration: '28:14',
    pace: '8:15 /mi',
  },
  breakdown: [{ key: 'distance', label: 'Distance', detail: '3.42 mi', xp: 300 }],
};

describe('buildPostRunXpGainEvent', () => {
  it('returns the run event when no achievements unlock', () => {
    const event = buildPostRunXpGainEvent({
      beforeTotalXp: 5000,
      runEvent,
      achievementUnlocks: [],
    });

    expect(event).toBe(runEvent);
  });

  it('returns a combined event when achievements unlock', () => {
    const event = buildPostRunXpGainEvent({
      beforeTotalXp: 5000,
      runEvent,
      achievementUnlocks: [unlock],
    });

    expect(event.source).toBe('combined');
    expect(event.xpEarned).toBe(400);
    expect(event.breakdown).toHaveLength(2);
    expect(event.runSummary?.distance).toBe('3.42 mi');
    expect(event.achievementSummary).toHaveLength(1);
  });
});
