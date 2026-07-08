import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Team } from '../../mock';
import { colors, spacing } from '../../theme';
import { rankTierColorForTier, shortRankTierName } from './rankAvatarBorderTheme';
import { TeamAvatar } from './TeamAvatar';

type TeamTopSectionProps = {
  team: Pick<
    Team,
    | 'name'
    | 'tag'
    | 'motto'
    | 'level'
    | 'competitiveRating'
    | 'teamRank'
    | 'shieldIcon'
    | 'shieldAccent'
    | 'logoUrl'
  >;
  onRankPress?: () => void;
};

export function TeamTopSection({ team, onRankPress }: TeamTopSectionProps) {
  const tierName = shortRankTierName(team.teamRank.tierId, team.teamRank.tierTitle);
  const tierColor = rankTierColorForTier(team.teamRank.tierId);

  return (
    <View style={styles.container}>
      <TeamAvatar
        accent={team.shieldAccent}
        icon={team.shieldIcon}
        imageUrl={team.logoUrl}
        rankTierId={team.teamRank.tierId}
        size={72}
      />

      <View style={styles.rightColumn}>
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.name}>
              {team.name}
            </Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{team.tag}</Text>
            </View>
            <Text numberOfLines={1} style={styles.motto}>
              {team.motto}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityHint="Opens the top teams leaderboard"
          accessibilityLabel={`Level ${team.level}. Rank ${tierName}. ${team.competitiveRating} power rating.`}
          accessibilityRole="button"
          disabled={!onRankPress}
          onPress={onRankPress}
          style={styles.levelRankRow}
        >
          <View style={styles.levelBlock}>
            <Text style={styles.label}>LEVEL</Text>
            <Text style={styles.levelValue}>{team.level}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rankBlock}>
            <Text style={styles.rankHeaderLine}>
              <Text style={styles.label}>RANK: </Text>
              <Text style={[styles.rankTitle, { color: tierColor }]}>{tierName}</Text>
            </Text>
            <Text style={styles.ratingLine}>
              <Text style={styles.ratingValue}>{team.competitiveRating.toLocaleString()}</Text>
              <Text style={styles.ratingSuffix}> Power Rating</Text>
            </Text>
            <Text numberOfLines={1} style={styles.standingLine}>
              {team.teamRank.rank > 0 ? `#${team.teamRank.rank}` : '—'} · {team.teamRank.topPercent}{' '}
              {team.teamRank.subtitle}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
    minWidth: 0,
    gap: spacing.lg,
  },
  identity: {
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  tag: {
    flexShrink: 0,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tagText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  motto: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
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
    fontSize: 28,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 30,
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
    fontSize: 24,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 26,
  },
  ratingSuffix: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  standingLine: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
});
