import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TeamMatchHistoryEntry } from '../../mock';
import { colors, spacing } from '../../theme';
import { TeamAvatar } from './TeamAvatar';

type TeamActivityMatchRowProps = {
  match: TeamMatchHistoryEntry;
  onPress?: () => void;
  showDivider?: boolean;
};

const LOGO_SIZE = 28;

function outcomeCopy(outcome: TeamMatchHistoryEntry['outcome']) {
  if (outcome === 'win') {
    return { label: 'VICTORY', color: colors.accentLime };
  }
  if (outcome === 'loss') {
    return { label: 'LOSS', color: '#FF6B6B' };
  }
  return { label: 'TIE', color: colors.textSecondary };
}

export function TeamActivityMatchRow({ match, onPress, showDivider = true }: TeamActivityMatchRowProps) {
  const copy = outcomeCopy(match.outcome);

  return (
    <View>
      <Pressable
        accessibilityLabel={`${match.homeTeam.name} vs ${match.awayTeam.name}, ${match.outcome}`}
        accessibilityRole="button"
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && onPress ? styles.pressed : null]}
      >
        <View style={styles.logos}>
          <TeamAvatar
            accent={match.homeTeam.accent}
            icon={match.homeTeam.shieldIcon}
            imageUrl={match.homeTeam.logoUrl}
            rankTierId={match.homeTeam.rankTierId}
            size={LOGO_SIZE}
          />
          <Text style={styles.vsText}>vs</Text>
          <TeamAvatar
            accent={match.awayTeam.accent}
            icon={match.awayTeam.shieldIcon}
            imageUrl={match.awayTeam.logoUrl}
            rankTierId={match.awayTeam.rankTierId}
            size={LOGO_SIZE}
          />
        </View>

        <View style={styles.meta}>
          <Text numberOfLines={1} style={styles.matchup}>
            {match.homeTeam.name} <Text style={styles.score}>{match.homePoints}</Text> –{' '}
            <Text style={styles.score}>{match.awayPoints}</Text> {match.awayTeam.name}
          </Text>
          <Text style={styles.subtext}>Team Match</Text>
        </View>

        <View style={styles.trailing}>
          <Text style={[styles.outcome, { color: copy.color }]}>{copy.label}</Text>
        </View>
      </Pressable>

      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.75,
  },
  logos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vsText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  matchup: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  score: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  subtext: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  trailing: {
    flexShrink: 0,
  },
  outcome: {
    fontSize: 11,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
