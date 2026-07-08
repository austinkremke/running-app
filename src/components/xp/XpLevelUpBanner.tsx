import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { colors, spacing } from '../../theme';

type XpLevelUpBannerProps = {
  visible: boolean;
  level: number;
  /** Overrides the default "Level Up!" label — e.g. for a rank-up moment reusing this same animation. */
  title?: string;
  /** Overrides the default "You've reached level {level}" line. */
  subtitle?: string;
};

export function XpLevelUpBanner({ visible, level, title, subtitle }: XpLevelUpBannerProps) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      scale.setValue(0.6);
      opacity.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 9,
        stiffness: 180,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, visible]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.banner, { opacity, transform: [{ scale }] }]}>
      <Text style={styles.label}>{title ?? 'Level Up!'}</Text>
      <Text style={styles.level}>{subtitle ?? `You've reached level ${level}`}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: 'rgba(227, 255, 106, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(227, 255, 106, 0.35)',
  },
  label: {
    color: colors.accentLime,
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  level: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});
