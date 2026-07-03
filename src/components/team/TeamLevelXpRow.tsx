import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';
import { HexBadge } from '../me/HexBadge';

type TeamLevelXpRowProps = {
  level: number;
};

// Team level is a snapshot of combined member XP — it can move with roster
// changes, so no XP progress bar (progression semantics don't hold). A real
// clan-points bar is on the milestone 07 backlog.
export function TeamLevelXpRow({ level }: TeamLevelXpRowProps) {
  return (
    <View style={styles.container}>
      <HexBadge icon="paw" iconSize={12} size={28} variant="purple" />
      <View style={styles.levelMeta}>
        <Text style={styles.levelLabel}>LEVEL</Text>
        <Text style={styles.levelValue}>{level}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  levelMeta: {
    gap: 0,
  },
  levelLabel: {
    color: colors.accentPurple,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  levelValue: {
    color: colors.accentPurple,
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
