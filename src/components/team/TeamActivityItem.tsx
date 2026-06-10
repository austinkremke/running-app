import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { TeamActivity } from '../../mock';
import { colors, spacing } from '../../theme';
import { HexBadge } from '../me/HexBadge';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type TeamActivityItemProps = {
  activity: TeamActivity;
  showDivider?: boolean;
};

export function TeamActivityItem({ activity, showDivider = true }: TeamActivityItemProps) {
  return (
    <View>
      <View style={styles.row}>
        <HexBadge icon={activity.icon as IoniconsName} iconSize={16} size={40} variant={activity.variant} />

        <View style={styles.meta}>
          <Text style={styles.message}>
            {activity.highlight ? (
              <Text style={styles.highlight}>{activity.highlight} </Text>
            ) : null}
            {activity.message}
          </Text>
          <Text style={styles.time}>{activity.timeAgo}</Text>
        </View>
      </View>

      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  meta: {
    flex: 1,
    gap: 3,
  },
  message: {
    color: colors.textPrimary,
    fontSize: 12,
    lineHeight: 16,
  },
  highlight: {
    fontWeight: '700',
  },
  time: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
