import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { TeamStat } from '../../mock';
import { colors, spacing } from '../../theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type TeamStatItemProps = {
  stat: TeamStat;
};

export function TeamStatItem({ stat }: TeamStatItemProps) {
  return (
    <View style={styles.card}>
      <Ionicons color={stat.iconColor} name={stat.icon as IoniconsName} size={18} />
      <Text numberOfLines={2} style={styles.label}>
        {stat.label}
      </Text>
      <Text numberOfLines={1} style={styles.value}>
        {stat.value}
      </Text>
      {stat.sublabel ? (
        <Text numberOfLines={1} style={styles.sublabel}>
          {stat.sublabel}
        </Text>
      ) : null}
    </View>
  );
}

export const TEAM_STAT_CARD_WIDTH = 100;

const styles = StyleSheet.create({
  card: {
    width: TEAM_STAT_CARD_WIDTH,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    gap: 3,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: spacing.xs,
    lineHeight: 11,
  },
  value: {
    color: colors.accentLime,
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  sublabel: {
    color: colors.textSecondary,
    fontSize: 8,
    textAlign: 'center',
  },
});
