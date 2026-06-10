import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';
import { HexBadge } from '../me/HexBadge';
import { TeamShieldLogo } from '../team/TeamShieldLogo';

type MatchTeamSummaryCardProps = {
  teamName: string;
  powerRating: number;
  teamLevel: number;
};

export function MatchTeamSummaryCard({
  teamName,
  powerRating,
  teamLevel,
}: MatchTeamSummaryCardProps) {
  return (
    <View style={styles.card}>
      <TeamShieldLogo width={64} />

      <View style={styles.meta}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={styles.name}>
            {teamName}
          </Text>
          <Pressable accessibilityLabel="Edit team name" hitSlop={8}>
            <Ionicons color={colors.textSecondary} name="pencil" size={12} />
          </Pressable>
        </View>

        <View style={styles.powerRow}>
          <Text style={styles.powerLabel}>Power Rating</Text>
          <Ionicons color={colors.textSecondary} name="information-circle-outline" size={11} />
        </View>
        <Text style={styles.powerValue}>{powerRating.toLocaleString('en-US')}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.levelBlock}>
        <Text style={styles.levelLabel}>Team Level</Text>
        <HexBadge badgeText={String(teamLevel)} size={40} stroked variant="lime" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  powerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  powerLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  powerValue: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.divider,
    marginVertical: 2,
  },
  levelBlock: {
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  levelLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
