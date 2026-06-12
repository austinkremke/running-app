import { StyleSheet, View } from 'react-native';

import type { TeamMatchTeam } from '../../../mock';
import { spacing } from '../../../theme';
import { TeamMatchRosterColumn } from './TeamMatchRosterColumn';

type TeamMatchRostersProps = {
  homeTeam: TeamMatchTeam;
  awayTeam: TeamMatchTeam;
};

export function TeamMatchRosters({ homeTeam, awayTeam }: TeamMatchRostersProps) {
  return (
    <View style={styles.container}>
      <TeamMatchRosterColumn team={homeTeam} />
      <TeamMatchRosterColumn team={awayTeam} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
