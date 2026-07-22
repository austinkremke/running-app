import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { UserProfile } from '../../mock';
import { colors, spacing } from '../../theme';
import { ProfileAvatar } from './ProfileAvatar';
import { ShimmerText } from './ShimmerText';
import { rankTierColorForTier, shortRankTierName } from '../team/rankAvatarBorderTheme';

type ProfileTopSectionProps = {
  profile: Pick<UserProfile, 'name' | 'avatarUrl' | 'clanName' | 'level' | 'rank'>;
  onEditAvatar?: () => void;
};

const AVATAR_SIZE = 64;

function formatRating(rank: UserProfile['rank']): string {
  if (rank.competitiveRating != null) {
    return rank.competitiveRating.toLocaleString();
  }

  return rank.subtitle.replace(/\s*(rating|points|power rating)$/i, '').trim();
}

export function ProfileTopSection({ profile, onEditAvatar }: ProfileTopSectionProps) {
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
        <View style={styles.levelBlock}>
          <Text style={[styles.label, styles.levelLabel, styles.centerText]}>LEVEL</Text>
          <Text style={[styles.levelValue, styles.centerText]}>{profile.level}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.rankBlock}>
          <Text style={styles.label}>RANK</Text>
          <ShimmerText
            color={rankTierColorForTier(profile.rank.tierId)}
            fontSize={28}
            letterSpacing={0.3}
            text={shortRankTierName(profile.rank.tierId, profile.rank.title)}
          />
          <Text style={styles.ratingLine}>
            <Text style={styles.ratingValue}>{formatRating(profile.rank)}</Text>
            <Text style={styles.ratingSuffix}> Power Rating</Text>
          </Text>
        </View>
      </View>

      {profile.rank.nextRankGoal ? (
        <View style={styles.nextRankBlock}>
          <Text style={styles.nextRankLabel}>Next rank</Text>
          <Text style={styles.nextRankLine}>
            <Text style={styles.nextRankRating}>
              {profile.rank.nextRankGoal.nextTierMinRating.toLocaleString()}
            </Text>
            <Text style={styles.nextRankLabel}> </Text>
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
        </View>
      ) : null}
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
  nextRankBlock: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    alignItems: 'flex-end',
  },
  nextRankLine: {
    marginTop: 1,
  },
  nextRankLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  nextRankRating: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  nextRankTier: {
    fontSize: 11,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
});
