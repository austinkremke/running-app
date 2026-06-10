import { StyleSheet, Text, View } from 'react-native';

import type { ProfileExperience } from '../../mock';
import { colors, spacing } from '../../theme';
import { HexBadge } from './HexBadge';
import { XpProgressBar } from './XpProgressBar';

type ExperienceCardProps = {
  experience: ProfileExperience;
};

function formatXp(value: number): string {
  return value.toLocaleString('en-US');
}

export function ExperienceCard({ experience }: ExperienceCardProps) {
  const { currentXp, nextLevelXp, nextLevel } = experience;
  const xpRemaining = nextLevelXp - currentXp;
  const progress = Math.min(currentXp / nextLevelXp, 1);

  return (
    <View style={styles.card}>
      <View style={styles.progressSection}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionLabel}>EXPERIENCE</Text>
          <Text style={styles.xpText}>
            <Text style={styles.xpCurrent}>{formatXp(currentXp)}</Text>
            <Text style={styles.xpTotal}> / {formatXp(nextLevelXp)} XP</Text>
          </Text>
        </View>

        <XpProgressBar progress={progress} />

        <Text style={styles.remaining}>{formatXp(xpRemaining)} XP to next level</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.nextLevelSection}>
        <Text style={styles.nextLabel}>NEXT LEVEL</Text>
        <HexBadge badgeText={String(nextLevel)} size={44} variant="outline" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  progressSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  xpText: {
    fontSize: 11,
    fontWeight: '600',
  },
  xpCurrent: {
    color: colors.accentLime,
  },
  xpTotal: {
    color: colors.textSecondary,
  },
  remaining: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: spacing.xs,
  },
  divider: {
    width: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  nextLevelSection: {
    width: 84,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  nextLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
