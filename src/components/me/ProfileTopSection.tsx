import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { UserProfile } from '../../mock';
import type { CompetitiveStats } from '../../services/competitiveStatsService';
import type { WeeklyProgressSummary } from '../../services/weeklyProgressService';
import { colors, spacing } from '../../theme';
import { ProfileAvatar } from './ProfileAvatar';
import { rankTierColorForTier, shortRankTierName } from '../team/rankAvatarBorderTheme';

type ProfileTopSectionProps = {
  profile: Pick<UserProfile, 'name' | 'avatarUrl' | 'clanName' | 'level' | 'rank'>;
  /** Progress hides the rank block in favor of a last-7-days summary; Competitive shows rank as before. */
  mode?: 'progress' | 'competitive';
  weeklySummary?: WeeklyProgressSummary | null;
  competitiveStats?: CompetitiveStats | null;
  onEditAvatar?: () => void;
};

const AVATAR_SIZE = 64;

function formatRating(rank: UserProfile['rank']): string {
  if (rank.competitiveRating != null) {
    return rank.competitiveRating.toLocaleString();
  }

  return rank.subtitle.replace(/\s*(rating|points|power rating)$/i, '').trim();
}

function xpGainedLine(summary: WeeklyProgressSummary): string {
  if (summary.levelsGained > 0) {
    const levelWord = summary.levelsGained === 1 ? 'level' : 'levels';
    return `${summary.xpGained.toLocaleString()} XP and ${summary.levelsGained} ${levelWord} gained`;
  }
  return `${summary.xpGained.toLocaleString()} XP gained`;
}

export function ProfileTopSection({
  profile,
  mode = 'competitive',
  weeklySummary,
  competitiveStats,
  onEditAvatar,
}: ProfileTopSectionProps) {
  const showRank = mode === 'competitive';

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.avatarSlot}>
          <ProfileAvatar
            avatarUrl={profile.avatarUrl}
            onEditPress={onEditAvatar}
            rankBorderTierId={profile.rank.tierId}
            size={AVATAR_SIZE}
          />
        </View>

        <View style={styles.identity}>
          <Text style={styles.name}>{profile.name}</Text>
          {profile.clanName ? (
            <View style={styles.clanRow}>
              <Ionicons color={colors.accentLime} name="shield-outline" size={12} />
              <Text style={styles.clanName}>{profile.clanName}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.bottomRow}>
        {showRank ? (
          <>
            <View style={styles.rankBlock}>
              <Text style={styles.label}>RANK</Text>
              <Text style={[styles.rankValue, { color: rankTierColorForTier(profile.rank.tierId) }]}>
                {shortRankTierName(profile.rank.tierId, profile.rank.title).toUpperCase()}
              </Text>
              <Text style={styles.ratingLine}>
                <Text style={styles.ratingValue}>{formatRating(profile.rank)}</Text>
                <Text style={styles.ratingSuffix}> Power Rating</Text>
              </Text>
            </View>

            {competitiveStats && competitiveStats.totalMatches > 0 ? (
              <>
                <View style={styles.divider} />

                <View style={styles.recordBlock}>
                  <Text style={styles.label}>RECORD</Text>
                  <Text style={styles.recordValue}>
                    {competitiveStats.wins}-{competitiveStats.losses}
                  </Text>
                  <Text style={styles.recordMeta}>{competitiveStats.totalMatches} matches</Text>
                </View>
              </>
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.levelBlock}>
              <Text style={[styles.label, styles.levelLabel, styles.centerText]}>LEVEL</Text>
              <Text style={[styles.levelValue, styles.centerText]}>{profile.level}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.weeklyBlock}>
              <Text style={styles.label}>LAST WEEK</Text>
              {weeklySummary && weeklySummary.workoutsCompleted > 0 ? (
                <>
                  <View style={styles.weeklyRow}>
                    <Ionicons color={colors.accentOrange} name="flame" size={14} />
                    <Text style={styles.weeklyText}>
                      {weeklySummary.workoutsCompleted} workout{weeklySummary.workoutsCompleted === 1 ? '' : 's'}{' '}
                      completed
                    </Text>
                  </View>
                  <View style={styles.weeklyRow}>
                    <Ionicons color={colors.accentLime} name="trending-up" size={14} />
                    <Text style={styles.weeklyText}>{xpGainedLine(weeklySummary)}</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.weeklyText}>No workouts in the past week</Text>
                  <Text style={styles.weeklyMeta}>Log some workout to level up!</Text>
                </>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    gap: spacing.md,
    overflow: 'visible',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarSlot: {
    width: AVATAR_SIZE,
    alignItems: 'flex-start',
  },
  identity: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  clanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  clanName: {
    color: colors.accentLime,
    fontSize: 12,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.xl,
    // Fixed so switching Progress <-> Competitive never shifts layout (no CLS) —
    // both the rank block and the weekly-summary block fit within this height.
    minHeight: 78,
  },
  levelBlock: {
    width: AVATAR_SIZE + spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  levelLabel: {
    fontSize: 12,
  },
  levelValue: {
    color: colors.textPrimary,
    fontSize: 46,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 48,
    marginTop: spacing.xs,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.divider,
  },
  rankBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rankValue: {
    fontSize: 28,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  ratingLine: {
    marginTop: spacing.xs,
  },
  ratingValue: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 30,
  },
  ratingSuffix: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 30,
  },
  recordBlock: {
    minWidth: 0,
    gap: 2,
  },
  recordValue: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    fontStyle: 'italic',
    lineHeight: 30,
    marginTop: spacing.xs,
  },
  recordMeta: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  weeklyBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 4,
  },
  weeklyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  weeklyText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  weeklyMeta: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
});
