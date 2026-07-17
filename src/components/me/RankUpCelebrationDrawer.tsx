import { useEffect, useRef } from 'react';
import { Animated, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { rankBorderGradientStopsForTier, rankTierColorForTier, shortRankTierName } from '../team/rankAvatarBorderTheme';
import { RankBorderAvatar } from '../team/RankBorderAvatar';
import { colors, spacing } from '../../theme';

const MOCK_AVATAR_URI = Image.resolveAssetSource(require('../../../assets/lifestyle-2-v2.png')).uri;

type RankUpCelebrationDrawerProps = {
  visible: boolean;
  onClose: () => void;
  /** Ignored — this drawer always uses a stock mock avatar so screenshots never show a real face. */
  avatarUrl?: string;
  fromTierId: string;
  toTierId: string;
};

const AVATAR_SIZE = 148;

export function RankUpCelebrationDrawer({
  visible,
  onClose,
  fromTierId,
  toTierId,
}: RankUpCelebrationDrawerProps) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.7)).current;
  const ringMorph = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (!visible) {
      overlayOpacity.setValue(0);
      avatarScale.setValue(0.7);
      ringMorph.setValue(0);
      textOpacity.setValue(0);
      textTranslate.setValue(12);
      return;
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(avatarScale, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 160 }),
      ]),
      Animated.timing(ringMorph, { toValue: 1, duration: 650, useNativeDriver: false }),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.spring(textTranslate, { toValue: 0, useNativeDriver: true, damping: 10, stiffness: 160 }),
      ]),
    ]).start();
  }, [avatarScale, overlayOpacity, ringMorph, textOpacity, textTranslate, visible]);

  const fromColor = rankTierColorForTier(fromTierId);
  const toColor = rankTierColorForTier(toTierId);
  const glowColor = ringMorph.interpolate({
    inputRange: [0, 1],
    outputRange: [fromColor, toColor],
  });

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible={visible}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <View style={styles.content}>
          <Animated.Text style={[styles.victory, { opacity: overlayOpacity }]}>VICTORY!</Animated.Text>

          <Text style={styles.eyebrow}>RANK UP</Text>

          <Animated.View style={[styles.avatarWrap, { transform: [{ scale: avatarScale }] }]}>
            <Animated.View style={[styles.glow, { shadowColor: glowColor }]}>
              <RankUpRing
                avatarUrl={MOCK_AVATAR_URI}
                fromTierId={fromTierId}
                progress={ringMorph}
                toTierId={toTierId}
              />
            </Animated.View>
          </Animated.View>

          <Animated.View
            style={[
              styles.tierRow,
              { opacity: textOpacity, transform: [{ translateY: textTranslate }] },
            ]}
          >
            <Text style={[styles.tierLabel, { color: fromColor }]}>
              {shortRankTierName(fromTierId).toUpperCase()}
            </Text>
            <Text style={styles.arrow}>{'→'}</Text>
            <Text style={[styles.tierLabel, { color: toColor }]}>
              {shortRankTierName(toTierId).toUpperCase()}
            </Text>
          </Animated.View>

          <Animated.Text
            style={[styles.headline, { opacity: textOpacity, transform: [{ translateY: textTranslate }] }]}
          >
            {`YOU'VE REACHED ${shortRankTierName(toTierId).toUpperCase()}!`}
          </Animated.Text>

          <Animated.View style={{ opacity: textOpacity }}>
            <Pressable
              accessibilityLabel="Continue"
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}
            >
              <Text style={styles.continueLabel}>CONTINUE</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

type RankUpRingProps = {
  avatarUrl?: string;
  fromTierId: string;
  toTierId: string;
  progress: Animated.Value;
};

function RankUpRing({ avatarUrl, fromTierId, toTierId, progress }: RankUpRingProps) {
  const fromOpacity = progress.interpolate({
    inputRange: [0, 0.45, 0.55, 1],
    outputRange: [1, 1, 0, 0],
  });
  const toOpacity = progress.interpolate({
    inputRange: [0, 0.45, 0.55, 1],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <View style={styles.ringStack}>
      <Animated.View style={[styles.ringLayer, { opacity: fromOpacity }]}>
        <RankBorderAvatar avatarUrl={avatarUrl} rankTierId={fromTierId} size={AVATAR_SIZE} />
      </Animated.View>
      <Animated.View style={[styles.ringLayer, { opacity: toOpacity }]}>
        <RankBorderAvatar avatarUrl={avatarUrl} rankTierId={toTierId} size={AVATAR_SIZE} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 7, 11, 0.92)',
  },
  content: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  victory: {
    color: colors.accentLime,
    fontSize: 30,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    marginTop: spacing.sm,
  },
  glow: {
    shadowOpacity: 0.85,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
  ringStack: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  ringLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tierLabel: {
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.6,
  },
  arrow: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  headline: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  continueButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.accentLime,
  },
  continueLabel: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.6,
  },
  pressed: {
    opacity: 0.85,
  },
});
