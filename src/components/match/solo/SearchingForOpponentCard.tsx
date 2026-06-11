import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { MatchmakingLoader } from '../MatchmakingLoader';
import { colors, spacing } from '../../../theme';

type SearchingForOpponentCardProps = {
  onCancel: () => void;
};

export function SearchingForOpponentCard({ onCancel }: SearchingForOpponentCardProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: false,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.5],
  });

  const glowRadius = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 16],
  });

  const borderColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(215, 255, 47, 0.28)', 'rgba(215, 255, 47, 0.7)'],
  });

  const statusDotOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View
      style={[
        styles.glowWrapper,
        {
          borderColor,
          shadowOpacity: glowOpacity,
          shadowRadius: glowRadius,
        },
      ]}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>Finding Match</Text>
          <Pressable
            accessibilityLabel="Cancel search"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onCancel}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          <MatchmakingLoader />

          <View style={styles.meta}>
            <Text style={styles.title}>Searching for an Opponent</Text>
            <Text style={styles.subtitle}>Looking for a runner of similar skill</Text>
            <View style={styles.statusRow}>
              <Animated.View style={[styles.statusDot, { opacity: statusDotOpacity }]} />
              <Text style={styles.status}>Matchmaking in progress</Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glowWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: colors.accentLime,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cancelButton: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  meta: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentLime,
  },
  status: {
    color: colors.accentLime,
    fontSize: 10,
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
