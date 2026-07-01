import { mapDefinitionToAchievement, sortAchievementsForMeCarousel } from '../achievementService';
import type { AchievementDefinitionRow } from '../achievementService';

describe('mapDefinitionToAchievement', () => {
  const definition: AchievementDefinitionRow = {
    id: 'first_run',
    display_name: 'First Run',
    description: 'Complete your first synced run.',
    category: 'distance',
    sort_order: 1,
    tier: 'gold',
    icon: 'footsteps',
    xp_reward: 100,
    criteria_type: 'activity_count',
    criteria_json: { count: 1 },
    is_hidden: false,
    is_active: true,
    requires_achievement_id: null,
  };

  it('maps unlocked achievements with formatted dates', () => {
    const item = mapDefinitionToAchievement(definition, '2026-06-01T12:00:00.000Z');

    expect(item.unlocked).toBe(true);
    expect(item.label).toBe('FIRST RUN');
    expect(item.description).toBe('Complete your first synced run.');
    expect(item.xpReward).toBe(100);
    expect(item.variant).toBe('gold');
    expect(item.date).toContain('2026');
  });

  it('maps locked achievements', () => {
    const item = mapDefinitionToAchievement(definition, null);

    expect(item.unlocked).toBe(false);
    expect(item.date).toBe('Locked');
  });
});

describe('sortAchievementsForMeCarousel', () => {
  const definition: AchievementDefinitionRow = {
    id: 'first_run',
    display_name: 'First Run',
    description: 'Complete your first synced run.',
    category: 'distance',
    sort_order: 1,
    tier: 'gold',
    icon: 'footsteps',
    xp_reward: 100,
    criteria_type: 'activity_count',
    criteria_json: { count: 1 },
    is_hidden: false,
    is_active: true,
    requires_achievement_id: null,
  };

  it('puts locked achievements before unlocked ones', () => {
    const locked = mapDefinitionToAchievement(definition, null);
    const unlocked = mapDefinitionToAchievement(
      { ...definition, id: 'five_miles', sort_order: 2 },
      '2026-06-01T12:00:00.000Z',
    );

    const sorted = sortAchievementsForMeCarousel([unlocked, locked]);

    expect(sorted.map((item) => item.id)).toEqual(['first_run', 'five_miles']);
  });

  it('orders locked achievements by likely completion path', () => {
    const rateApp = mapDefinitionToAchievement(
      {
        ...definition,
        id: 'rate_app',
        display_name: 'Rate Run Off',
        category: 'community',
        sort_order: 40,
        criteria_type: 'client_event',
        criteria_json: { event: 'rate_app' },
      },
      null,
    );
    const firstRun = mapDefinitionToAchievement(definition, null);
    const sharePost = mapDefinitionToAchievement(
      {
        ...definition,
        id: 'share_post',
        display_name: 'Share the W',
        category: 'social',
        sort_order: 33,
        criteria_type: 'client_event',
        criteria_json: { event: 'share_feed_post' },
      },
      null,
    );

    const sorted = sortAchievementsForMeCarousel([firstRun, sharePost, rateApp]);

    expect(sorted.map((item) => item.id)).toEqual(['rate_app', 'share_post', 'first_run']);
  });
});
