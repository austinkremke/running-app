import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  AchievementsAllModal,
  AchievementsSection,
  CommunityAchievementsSection,
  ExperienceCard,
  OverallStatsSection,
  ProfileTopSection,
  SectionHeader,
} from '../components/me';
import { useAuth, usePlayerProgress, useXpGain } from '../context';
import { useAchievements } from '../hooks/useAchievements';
import { useRankDisplay } from '../hooks/useRankDisplay';
import { MOCK_PROFILE } from '../mock';
import { colors, spacing } from '../theme';

type MeScreenProps = {
  onOpenSettings?: () => void;
};

export function MeScreen({ onOpenSettings }: MeScreenProps) {
  const { gameState } = useAuth();
  const { level, experience } = usePlayerProgress();
  const { showAchievementUnlocks } = useXpGain();
  const { profileRank } = useRankDisplay();
  const { unlocked, allAchievements, loading, reload } = useAchievements({
    evaluateOnMount: true,
    onUnlock: showAchievementUnlocks,
  });
  const [viewAllVisible, setViewAllVisible] = useState(false);

  const profile = {
    ...MOCK_PROFILE,
    name: gameState?.profile.display_name ?? MOCK_PROFILE.name,
    avatarUrl: gameState?.profile.avatar_url ?? undefined,
    level,
    experience,
    rank: profileRank,
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.profileGroup}>
          <ProfileTopSection onEditAvatar={onOpenSettings} profile={profile} />
          <ExperienceCard experience={profile.experience} />
        </View>

        {loading ? (
          <Text style={styles.loading}>Loading achievements…</Text>
        ) : unlocked.length > 0 ? (
          <AchievementsSection
            achievements={unlocked}
            onViewAll={() => setViewAllVisible(true)}
          />
        ) : (
          <View style={styles.emptyAchievements}>
            <SectionHeader
              actionLabel="VIEW ALL"
              onActionPress={() => setViewAllVisible(true)}
              title="ACHIEVEMENTS"
            />
            <Text style={styles.emptyCopy}>Complete your first run to start earning badges.</Text>
          </View>
        )}

        <CommunityAchievementsSection achievements={allAchievements} onUpdated={() => void reload()} />
        <OverallStatsSection stats={profile.overallStats} />
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <AchievementsAllModal
        achievements={allAchievements}
        onClose={() => setViewAllVisible(false)}
        visible={viewAllVisible}
      />
    </>
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
  loading: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyAchievements: {
    gap: spacing.xs,
  },
  emptyCopy: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: spacing.md,
  },
});
