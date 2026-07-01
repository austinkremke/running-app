import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import type { XpGainSegment } from '../../types/progression';
import { colors, spacing } from '../../theme';

type XpBreakdownRowProps = {
  segment: XpGainSegment;
  state: 'pending' | 'active' | 'done';
};

const TIER_ACCENT: Record<string, string> = {
  bronze: colors.accentPurple,
  silver: colors.textSecondary,
  gold: colors.accentGold,
  elite: colors.accentLime,
};

function achievementAccent(detail?: string): string | undefined {
  if (!detail) {
    return undefined;
  }

  const tier = detail.split(' · ')[0]?.toLowerCase();
  return tier ? TIER_ACCENT[tier] : undefined;
}

function formatXp(value: number): string {
  return value.toLocaleString('en-US');
}

export function XpBreakdownRow({ segment, state }: XpBreakdownRowProps) {
  const isPending = state === 'pending';
  const isRevealed = !isPending;
  const wasPendingRef = useRef(true);
  const rowOpacity = useRef(new Animated.Value(isPending ? 0.34 : 1)).current;
  const reveal = useRef(new Animated.Value(isPending ? 0 : 1)).current;

  useEffect(() => {
    if (isRevealed && wasPendingRef.current) {
      wasPendingRef.current = false;
      reveal.setValue(0);
      rowOpacity.setValue(0.34);

      Animated.parallel([
        Animated.timing(rowOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(reveal, {
          toValue: 1,
          friction: 8,
          tension: 140,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (isPending) {
      wasPendingRef.current = true;
      rowOpacity.setValue(0.34);
      reveal.setValue(0);
    }
  }, [isPending, isRevealed, reveal, rowOpacity]);

  const xpTranslateY = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 0],
  });

  const detailOpacity = reveal;
  const isAchievement = segment.key === 'achievement';
  const accentColor = isAchievement ? achievementAccent(segment.detail) : undefined;

  return (
    <Animated.View
      style={[
        styles.row,
        isPending ? styles.rowPending : styles.rowRevealed,
        isAchievement && accentColor ? { borderColor: accentColor } : null,
        { opacity: rowOpacity },
      ]}
    >
      <View style={styles.copy}>
        <Text style={[styles.label, isPending ? styles.labelPending : styles.labelRevealed]}>
          {segment.label}
        </Text>
        <Animated.Text
          style={[
            styles.detail,
            isPending ? styles.detailPending : styles.detailRevealed,
            { opacity: detailOpacity },
          ]}
        >
          {segment.detail ?? ' '}
        </Animated.Text>
      </View>

      <View style={styles.xpSlot}>
        <Animated.Text
          style={[
            styles.xp,
            isPending ? styles.xpHidden : styles.xpRevealed,
            {
              opacity: reveal,
              transform: [{ translateY: xpTranslateY }],
            },
          ]}
        >
          +{formatXp(segment.xp)}
        </Animated.Text>
      </View>
    </Animated.View>
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
    borderWidth: 1,
    minHeight: 52,
  },
  rowPending: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  rowRevealed: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  labelPending: {
    color: colors.textSecondary,
  },
  labelRevealed: {
    color: colors.textPrimary,
  },
  detail: {
    fontSize: 11,
    fontWeight: '500',
    minHeight: 14,
  },
  detailPending: {
    color: colors.textSecondary,
  },
  detailRevealed: {
    color: colors.textSecondary,
  },
  xpSlot: {
    minWidth: 52,
    alignItems: 'flex-end',
  },
  xp: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  xpHidden: {
    color: colors.textSecondary,
  },
  xpRevealed: {
    color: colors.accentLime,
  },
});
