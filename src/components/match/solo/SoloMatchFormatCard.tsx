import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { TeamMatchFormat } from '../../../mock';
import { colors, spacing } from '../../../theme';
import { HexBadge } from '../../me/HexBadge';

type SoloMatchFormatCardProps = {
  format: TeamMatchFormat;
};

export function SoloMatchFormatCard({ format }: SoloMatchFormatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Match Format</Text>
        <View style={styles.durationBadge}>
          <Ionicons color={colors.accentLime} name="calendar-outline" size={10} />
          <Text style={styles.durationText}>{format.durationLabel}</Text>
        </View>
      </View>

      <View style={styles.heroRow}>
        <HexBadge badgeText="1v1" size={44} stroked variant="lime" />

        <View style={styles.heroMeta}>
          <Text style={styles.title}>{format.title}</Text>
          <Text style={styles.winCondition}>{format.winCondition}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.overview}>{format.overview}</Text>
      <Text style={styles.scoringDetails}>{format.scoringDetails}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accentLime,
    backgroundColor: 'rgba(215, 255, 47, 0.08)',
  },
  durationText: {
    color: colors.accentLime,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroMeta: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  winCondition: {
    color: colors.accentLime,
    fontSize: 11,
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  overview: {
    color: colors.textPrimary,
    fontSize: 11,
    lineHeight: 16,
  },
  scoringDetails: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
  },
});
