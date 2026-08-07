import { StyleSheet, Text, View } from 'react-native';

import type { ProfileExperience } from '../../mock';
import { colors, spacing } from '../../theme';
import { XpProgressBar } from './XpProgressBar';

type MiniXpBarProps = {
  experience: ProfileExperience;
  level: number;
};

const BAR_HEIGHT = 5;
const BAR_WIDTH = 72;

/**
 * Compact always-visible XP readout in the header's top-right, next to the
 * settings cog — replaces `ExperienceCard` in the Progress tab's big slot
 * below the avatar, which is now reserved for `RankProgressCard` (Competitive
 * only). Level/XP no longer disappears just because the user is looking at
 * Competitive.
 */
export function MiniXpBar({ experience, level }: MiniXpBarProps) {
  const progress = Math.min(experience.currentXp / experience.nextLevelXp, 1);

  return (
    <View style={styles.container}>
      <Text style={styles.level}>LV {level}</Text>
      <View style={{ width: BAR_WIDTH }}>
        <XpProgressBar
          fillColor={colors.textPrimary}
          height={BAR_HEIGHT}
          progress={progress}
          trackBorderColor={colors.textPrimary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    gap: 3,
  },
  level: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
