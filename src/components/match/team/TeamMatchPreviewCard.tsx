import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ActiveTeamMatch } from '../../../mock';
import { colors, spacing } from '../../../theme';
import { TeamAvatar } from '../../team/TeamAvatar';
import { MatchVsIndicator } from '../MatchVsIndicator';
import { formatMatchPoints, getTeamMatchAccentColor } from './matchTheme';

const LOGO_SIZE = 40;

type TeamMatchPreviewCardProps = {
  match: ActiveTeamMatch;
  onPress?: () => void;
};

export function TeamMatchPreviewCard({ match, onPress }: TeamMatchPreviewCardProps) {
  const { homeTeam, awayTeam } = match;

  return (
    <Pressable
      accessibilityLabel="View active team match"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.teamsRow}>
        <View style={styles.side}>
          <TeamAvatar
            accent={homeTeam.accent}
            icon={homeTeam.shieldIcon}
            imageUrl={homeTeam.logoUrl}
            rankTierId={homeTeam.rankTierId}
            size={LOGO_SIZE}
          />
          <Text numberOfLines={1} style={[styles.teamName, { color: getTeamMatchAccentColor(homeTeam.accent) }]}>
            {homeTeam.name.toUpperCase()}
          </Text>
          <Text style={styles.score}>{formatMatchPoints(homeTeam.totalPoints)}</Text>
        </View>

        <MatchVsIndicator variant="diamond" />

        <View style={styles.side}>
          <TeamAvatar
            accent={awayTeam.accent}
            icon={awayTeam.shieldIcon}
            imageUrl={awayTeam.logoUrl}
            rankTierId={awayTeam.rankTierId}
            size={LOGO_SIZE}
          />
          <Text numberOfLines={1} style={[styles.teamName, { color: getTeamMatchAccentColor(awayTeam.accent) }]}>
            {awayTeam.name.toUpperCase()}
          </Text>
          <Text style={styles.score}>{formatMatchPoints(awayTeam.totalPoints)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.viewLabel}>View Active Match</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  side: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  teamName: {
    fontSize: 10,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textAlign: 'center',
    maxWidth: '100%',
  },
  score: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: -0.3,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  viewLabel: {
    color: colors.accentLime,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
