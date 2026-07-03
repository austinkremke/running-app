import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ReceivedSoloChallenge } from '../../../services/challengeService';
import { colors, spacing } from '../../../theme';

type IncomingChallengeCardProps = {
  challenge: ReceivedSoloChallenge;
  disabled?: boolean;
  /** Level-gate CTA, e.g. "Reach level 3" — replaces Accept when the recipient is under-leveled. */
  acceptLockedLabel?: string | null;
  onAccept: () => void;
  onDecline: () => void;
};

const AVATAR_SIZE = 44;

export function IncomingChallengeCard({
  challenge,
  disabled = false,
  acceptLockedLabel = null,
  onAccept,
  onDecline,
}: IncomingChallengeCardProps) {
  const acceptDisabled = disabled || Boolean(acceptLockedLabel);
  const { challenger } = challenge;
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
    outputRange: ['rgba(255, 92, 92, 0.25)', 'rgba(255, 92, 92, 0.6)'],
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
          <Text style={styles.headerLabel}>Incoming Challenge</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>NEW</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.avatarWrap}>
            {challenger.avatarUrl ? (
              <Image source={{ uri: challenger.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
          </View>

          <View style={styles.meta}>
            <Text style={styles.name}>{challenger.name}</Text>
            <Text style={styles.level}>Level {challenger.level}</Text>
            <Text style={styles.prompt}>Challenged you to a 1v1 solo match</Text>
          </View>

          <View style={styles.iconWrap}>
            <Ionicons color={colors.danger} name="flash-outline" size={20} />
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="Decline challenge"
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onDecline}
            style={({ pressed }) => [
              styles.declineButton,
              disabled && styles.buttonDisabled,
              pressed && !disabled ? styles.pressed : null,
            ]}
          >
            <Text style={styles.declineLabel}>Decline</Text>
          </Pressable>

          <Pressable
            accessibilityLabel="Accept challenge"
            accessibilityRole="button"
            accessibilityState={{ disabled: acceptDisabled }}
            disabled={acceptDisabled}
            onPress={onAccept}
            style={({ pressed }) => [
              styles.acceptButton,
              acceptDisabled && styles.buttonDisabled,
              pressed && !acceptDisabled ? styles.pressed : null,
            ]}
          >
            {acceptLockedLabel ? (
              <View style={styles.lockedRow}>
                <Ionicons color={colors.background} name="lock-closed" size={12} />
                <Text style={styles.acceptLabel}>{acceptLockedLabel}</Text>
              </View>
            ) : (
              <Text style={styles.acceptLabel}>Accept</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glowWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: colors.danger,
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
  badge: {
    backgroundColor: colors.danger,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
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
    borderColor: colors.danger,
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
  prompt: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  declineButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
  },
  acceptButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.accentLime,
    paddingVertical: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  declineLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  acceptLabel: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '800',
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.85,
  },
});
