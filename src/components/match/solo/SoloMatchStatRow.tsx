import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { SoloMatchComparisonStat, TeamMatchAccent } from '../../../mock';
import { colors, spacing } from '../../../theme';
import { getTeamMatchAccentColor } from './soloMatchTheme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type SoloMatchStatRowProps = {
  stat: SoloMatchComparisonStat;
  homeAccent: TeamMatchAccent;
  awayAccent: TeamMatchAccent;
  showDivider?: boolean;
};

export function SoloMatchStatRow({
  stat,
  homeAccent,
  awayAccent,
  showDivider = true,
}: SoloMatchStatRowProps) {
  const isTied = stat.homeValue === stat.awayValue;
  const homeColor = isTied ? colors.divider : getTeamMatchAccentColor(homeAccent);
  const awayColor = isTied ? colors.divider : getTeamMatchAccentColor(awayAccent);
  const homeProgress = isTied ? 0.5 : stat.homeProgress;

  return (
    <View>
      <View style={styles.row}>
        <Text style={[styles.value, styles.valueHome, isTied && styles.tiedValue]}>{stat.homeValue}</Text>

        <View style={styles.center}>
          <Ionicons color={colors.textSecondary} name={stat.icon as IoniconsName} size={14} />
          <Text style={styles.label}>{stat.label.toUpperCase()}</Text>
        </View>

        <Text style={[styles.value, styles.valueAway, isTied && styles.tiedValue]}>{stat.awayValue}</Text>
      </View>

      <View style={[styles.progressTrack, isTied && styles.progressTrackTied]}>
        <View
          style={[
            styles.progressHome,
            { width: `${homeProgress * 100}%`, backgroundColor: homeColor },
          ]}
        />
        <View
          style={[
            styles.progressAway,
            { width: `${(1 - homeProgress) * 100}%`, backgroundColor: awayColor },
          ]}
        />
      </View>

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
  value: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    fontStyle: 'italic',
    color: colors.textPrimary,
  },
  valueHome: {
    textAlign: 'left',
  },
  valueAway: {
    textAlign: 'right',
  },
  tiedValue: {
    color: colors.textSecondary,
  },
  center: {
    width: 72,
    alignItems: 'center',
    gap: 2,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  progressTrack: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    marginBottom: spacing.xs,
  },
  progressTrackTied: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  progressHome: {
    height: '100%',
  },
  progressAway: {
    height: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
