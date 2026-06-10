import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { OverallStat } from '../../mock';
import { colors, spacing } from '../../theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type StatCardProps = {
  stat: OverallStat;
};

export function StatCard({ stat }: StatCardProps) {
  if (stat.layout === 'wide') {
    return <StatWideCard stat={stat} />;
  }

  return <StatGridCard stat={stat} />;
}

function StatGridCard({ stat }: StatCardProps) {
  return (
    <View style={styles.gridCard}>
      <Ionicons color={stat.iconColor} name={stat.icon as IoniconsName} size={20} />
      <Text style={styles.gridValue}>{stat.value}</Text>
      {stat.unit ? <Text style={styles.gridUnit}>{stat.unit}</Text> : null}
      <Text style={styles.gridLabel}>{stat.label}</Text>
    </View>
  );
}

function StatWideCard({ stat }: StatCardProps) {
  return (
    <View style={styles.wideCard}>
      <Ionicons color={stat.iconColor} name={stat.icon as IoniconsName} size={22} />
      <View style={styles.wideMeta}>
        <Text style={styles.wideValue}>{stat.value}</Text>
        <Text style={styles.wideLabel}>{stat.label}</Text>
        {stat.sublabel ? <Text style={styles.wideSublabel}>{stat.sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
    gap: 2,
  },
  gridValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    fontStyle: 'italic',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  gridUnit: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
  },
  gridLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  wideCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  wideMeta: {
    flex: 1,
    gap: 1,
  },
  wideValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  wideLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  wideSublabel: {
    color: colors.textSecondary,
    fontSize: 10,
  },
});
