import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ProposedChallenge } from '../../../mock';
import { colors, spacing } from '../../../theme';

type ProposedChallengeCardProps = {
  challenge: ProposedChallenge;
  onCancel: () => void;
};

const AVATAR_SIZE = 44;

export function ProposedChallengeCard({ challenge, onCancel }: ProposedChallengeCardProps) {
  const { friend } = challenge;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: false,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.38],
  });

  const glowRadius = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 12],
  });

  const borderColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(215, 255, 47, 0.2)', 'rgba(215, 255, 47, 0.55)'],
  });

  const statusDotOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1],
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
          <Text style={styles.headerLabel}>Proposed Challenge</Text>
          <Pressable
            accessibilityLabel="Cancel challenge"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onCancel}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.avatarWrap}>
            {friend.avatarUrl ? (
              <Image source={{ uri: friend.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
          </View>

          <View style={styles.meta}>
            <Text style={styles.name}>{friend.name}</Text>
            <Text style={styles.level}>Level {friend.level}</Text>
            <View style={styles.statusRow}>
              <Animated.View style={[styles.statusDot, { opacity: statusDotOpacity }]} />
              <Text style={styles.status}>Awaiting acceptance</Text>
            </View>
          </View>

          <View style={styles.iconWrap}>
            <Ionicons color={colors.accentLime} name="hourglass-outline" size={20} />
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
    elevation: 4,
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
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.accentLime,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceElevated,
    width: '100%',
    height: '100%',
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  level: {
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
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
