import { StyleSheet, Text, View } from 'react-native';

import type { RunStats } from '../../mock';
import { colors } from '../../theme';

type RunCardStatsProps = {
  stats: RunStats;
};

export function RunCardStats({ stats }: RunCardStatsProps) {
  return (
    <View style={styles.container}>
      <StatItem label="Distance" main={stats.distanceMiles.toFixed(2)} unit=" mi" />
      <StatItem label="Pace" main={stats.pacePerMile} unit=" /mi" />
      <StatItem label="Time" main={stats.duration} unit=" min" />
    </View>
  );
}

function StatItem({ label, main, unit }: { label: string; main: string; unit: string }) {
  return (
    <View style={styles.item}>
      <View style={styles.valueRow}>
        <Text style={styles.valueMain}>{main}</Text>
        <Text style={styles.valueUnit}>{unit}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  valueMain: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  valueUnit: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '400',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
});
