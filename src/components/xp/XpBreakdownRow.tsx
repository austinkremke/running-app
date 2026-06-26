import { StyleSheet, Text, View } from 'react-native';

import type { XpGainSegment } from '../../types/progression';
import { colors, spacing } from '../../theme';

type XpBreakdownRowProps = {
  segment: XpGainSegment;
  state: 'active' | 'done';
};

function formatXp(value: number): string {
  return value.toLocaleString('en-US');
}

export function XpBreakdownRow({ segment, state }: XpBreakdownRowProps) {
  const isActive = state === 'active';

  return (
    <View style={[styles.row, isActive && styles.rowActive]}>
      <View style={styles.left}>
        <View style={[styles.check, isActive ? styles.checkActive : styles.checkDone]}>
          <Text style={styles.checkMark}>{isActive ? '◦' : '✓'}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={[styles.label, isActive && styles.labelActive]}>{segment.label}</Text>
          {segment.detail ? <Text style={styles.detail}>{segment.detail}</Text> : null}
        </View>
      </View>
      <Text style={[styles.xp, isActive && styles.xpActive]}>+{formatXp(segment.xp)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowActive: {
    borderColor: colors.accentLime,
    backgroundColor: '#1A1F12',
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  checkActive: {
    borderColor: colors.accentLime,
    backgroundColor: '#243010',
  },
  checkDone: {
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  checkMark: {
    color: colors.accentLime,
    fontSize: 11,
    fontWeight: '800',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  labelActive: {
    color: colors.accentLime,
  },
  detail: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  xp: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  xpActive: {
    color: colors.accentLime,
  },
});
