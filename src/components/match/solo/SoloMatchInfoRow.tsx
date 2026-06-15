import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { SoloMatchInfo } from '../../../mock';
import { colors, spacing } from '../../../theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type SoloMatchInfoRowProps = {
  info: SoloMatchInfo;
};

export function SoloMatchInfoRow({ info }: SoloMatchInfoRowProps) {
  return (
    <View style={styles.container}>
      <InfoColumn
        label="Rank"
        subtext={info.rankPercentile}
        value={info.rank.toLocaleString('en-US')}
      />

      <View style={styles.divider} />

      <InfoColumn
        icon={info.matchTypeIcon as IoniconsName}
        label="Match Type"
        value={info.matchType}
      />

      <View style={styles.divider} />

      <InfoColumn
        icon="ellipse"
        iconColor={colors.accentLime}
        label="Entry Fee"
        subtext={info.entryFeeLabel}
        value={String(info.entryFee)}
      />
    </View>
  );
}

function InfoColumn({
  label,
  value,
  subtext,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon?: IoniconsName;
  iconColor?: string;
}) {
  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label.toUpperCase()}</Text>
      <View style={styles.valueRow}>
        {icon ? <Ionicons color={iconColor ?? colors.textSecondary} name={icon} size={12} /> : null}
        <Text style={styles.columnValue}>{value}</Text>
      </View>
      {subtext ? <Text style={styles.columnSubtext}>{subtext}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
  },
  columnLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  columnValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  columnSubtext: {
    color: colors.textSecondary,
    fontSize: 9,
    textAlign: 'center',
  },
});
