import { StyleSheet, Text, View } from 'react-native';

import type { TeamLogoAccent } from '../../mock';
import { colors, spacing } from '../../theme';
import { rankTierColorForTier, shortRankTierName } from '../team/rankAvatarBorderTheme';
import { TeamAvatar } from '../team/TeamAvatar';

type MatchTeamSummaryCardProps = {
  teamName: string;
  powerRating: number;
  teamLevel: number;
  shieldIcon: string;
  shieldAccent: TeamLogoAccent;
  logoUrl?: string;
  rankTierId?: string | null;
};

export function MatchTeamSummaryCard({
  teamName,
  powerRating,
  teamLevel,
  shieldIcon,
  shieldAccent,
  logoUrl,
  rankTierId,
}: MatchTeamSummaryCardProps) {
  const tierName = shortRankTierName(rankTierId);
  const tierColor = rankTierColorForTier(rankTierId);

  return (
    <View style={styles.card}>
      <TeamAvatar accent={shieldAccent} icon={shieldIcon} imageUrl={logoUrl} rankTierId={rankTierId} size={64} />

      <View style={styles.rightColumn}>
        <Text numberOfLines={1} style={styles.name}>
          {teamName}
        </Text>

        <View style={styles.levelRankRow}>
          <View style={styles.levelBlock}>
            <Text style={styles.label}>LEVEL</Text>
            <Text style={styles.levelValue}>{teamLevel}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rankBlock}>
            <Text style={styles.rankHeaderLine}>
              <Text style={styles.label}>RANK: </Text>
              <Text style={[styles.rankTitleText, { color: tierColor }]}>{tierName}</Text>
            </Text>
            <Text style={styles.ratingLine}>
              <Text style={styles.ratingValue}>{powerRating.toLocaleString('en-US')}</Text>
              <Text style={styles.ratingSuffix}> Power Rating</Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    overflow: 'visible',
  },
  rightColumn: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    fontStyle: 'italic',
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
  rankTitleText: {
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
});
