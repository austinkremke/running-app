import { mapDefinitionToAchievement } from '../achievementService';
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
    expect(item.variant).toBe('gold');
    expect(item.date).toContain('2026');
  });

  it('maps locked achievements', () => {
    const item = mapDefinitionToAchievement(definition, null);

    expect(item.unlocked).toBe(false);
    expect(item.date).toBe('Locked');
  });
});
