import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme';

type TeamLevelXpRowProps = {
  level: number;
};

// Team level is a snapshot of combined member XP — it can move with roster
// changes, so no XP progress bar (progression semantics don't hold). A real
// clan-points bar is on the milestone 07 backlog. De-emphasized vs. rank/rating,
// which are what actually matter competitively.
export function TeamLevelXpRow({ level }: TeamLevelXpRowProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.levelLabel}>LEVEL</Text>
      <Text style={styles.levelValue}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  levelLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  levelValue: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
  },
});
