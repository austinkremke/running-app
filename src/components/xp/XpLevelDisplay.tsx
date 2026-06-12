import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';
import { HexBadge } from '../me/HexBadge';

type XpLevelDisplayProps = {
  level: number;
  pulse?: boolean;
};

export function XpLevelDisplay({ level, pulse = false }: XpLevelDisplayProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulse) {
      scale.setValue(1);
      glow.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.18,
          useNativeDriver: true,
          damping: 8,
          stiffness: 180,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 10,
          stiffness: 160,
        }),
      ]),
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, [glow, level, pulse, scale]);

  const shadowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Level</Text>
      <Animated.View style={[styles.badgeWrap, { shadowOpacity }]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <HexBadge badgeText={String(level)} size={52} variant="outline" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  badgeWrap: {
    shadowColor: colors.accentLime,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 4,
  },
});
