import { ScrollView, StyleSheet, View } from 'react-native';

import {
  AchievementsSection,
  ExperienceCard,
  OverallStatsSection,
  ProfileTopSection,
} from '../components/me';
import { useAuth, usePlayerProgress } from '../context';
import { MOCK_PROFILE } from '../mock';
import { colors, spacing } from '../theme';

export function MeScreen() {
  const { gameState } = useAuth();
  const { level, experience } = usePlayerProgress();

  const profile = {
    ...MOCK_PROFILE,
    name: gameState?.profile.display_name ?? MOCK_PROFILE.name,
    avatarUrl: gameState?.profile.avatar_url ?? undefined,
    level,
    experience,
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      <View style={styles.profileGroup}>
        <ProfileTopSection profile={profile} />
        <ExperienceCard experience={profile.experience} />
      </View>
      <AchievementsSection achievements={profile.achievements} />
      <OverallStatsSection stats={profile.overallStats} />
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  profileGroup: {
    gap: spacing.md,
  },
  bottomSpacer: {
    height: spacing.md,
  },
});
