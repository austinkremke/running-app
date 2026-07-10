import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { UserProfile } from '../../mock';
import { colors, spacing } from '../../theme';
import { ProfileAvatar } from './ProfileAvatar';
import { rankTierColorForTier, shortRankTierName } from '../team/rankAvatarBorderTheme';

type ProfileTopSectionProps = {
  profile: Pick<UserProfile, 'name' | 'avatarUrl' | 'clanName' | 'level' | 'rank'>;
  onEditAvatar?: () => void;
};

const AVATAR_SIZE = 92;

function formatRating(rank: UserProfile['rank']): string {
  if (rank.competitiveRating != null) {
    return rank.competitiveRating.toLocaleString();
  }

  return rank.subtitle.replace(/\s*(rating|points|power rating)$/i, '').trim();
}

export function ProfileTopSection({ profile, onEditAvatar }: ProfileTopSectionProps) {
  return (
    <View style={styles.container}>
      <ProfileAvatar
        avatarUrl={profile.avatarUrl}
        onEditPress={onEditAvatar}
        rankBorderTierId={profile.rank.tierId}
        size={AVATAR_SIZE}
      />

      <View style={styles.rightColumn}>
        <View style={styles.identity}>
          <Text style={styles.name}>{profile.name}</Text>
          {profile.clanName ? (
            <View style={styles.clanRow}>
              <Ionicons color={colors.accentLime} name="shield-outline" size={12} />
              <Text style={styles.clanName}>{profile.clanName}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.levelRankRow}>
          <View style={styles.levelBlock}>
            <Text style={styles.label}>LEVEL</Text>
            <Text style={styles.levelValue}>{profile.level}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rankBlock}>
            <Text style={styles.rankHeaderLine}>
              <Text style={styles.label}>RANK </Text>
              <Text
                style={[
                  styles.rankTitle,
                  { color: rankTierColorForTier(profile.rank.tierId) },
                ]}
              >
                {shortRankTierName(profile.rank.tierId, profile.rank.title)}
              </Text>
            </Text>
            <Text style={styles.ratingLine}>
              <Text style={styles.ratingValue}>{formatRating(profile.rank)}</Text>
              <Text style={styles.ratingSuffix}> Power Rating</Text>
            </Text>
            {profile.rank.nextRankGoal ? (
              <Text style={styles.nextRankLine}>
                <Text style={styles.nextRankLabel}>Next rank at </Text>
                <Text style={styles.nextRankRating}>
                  {profile.rank.nextRankGoal.nextTierMinRating.toLocaleString()}
                </Text>
                <Text style={styles.nextRankLabel}> · </Text>
                <Text
                  style={[
                    styles.nextRankTier,
                    { color: rankTierColorForTier(profile.rank.nextRankGoal.nextTierId) },
                  ]}
                >
                  {shortRankTierName(
                    profile.rank.nextRankGoal.nextTierId,
                    profile.rank.nextRankGoal.nextTierTitle,
                  )}
                </Text>
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    overflow: 'visible',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rightColumn: {
    flex: 1,
    gap: spacing.lg,
  },
  identity: {
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
  levelRankRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },
  levelBlock: {
    minWidth: 44,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  levelValue: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 36,
    marginTop: spacing.xs,
  },
  divider: {
    width: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
  },
  rankBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rankHeaderLine: {
    marginTop: 0,
  },
  rankTitle: {
    fontSize: 12,
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
  nextRankLine: {
    marginTop: 4,
    lineHeight: 14,
  },
  nextRankLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  nextRankRating: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  nextRankTier: {
    fontSize: 10,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
});
