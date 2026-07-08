import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { TUTORIAL_USER } from '../../../config/onboardingTutorialData';
import { colors, spacing } from '../../../theme';
import { BottomSheetDrawer } from '../../drawer';
import { RankBorderAvatar } from '../../team/RankBorderAvatar';
import { AnimatedXpProgressBar } from '../../xp/AnimatedXpProgressBar';
import { ConfettiBurst } from '../../xp/ConfettiBurst';
import { XpLevelUpBanner } from '../../xp/XpLevelUpBanner';

const BAR_FILL_MS = 900;
const BORDER_CROSSFADE_MS = 600;
const RANK_PROGRESS = 0.68;
const AVATAR_SIZE = 96;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function animateTo(value: Animated.Value, toValue: number, duration: number, useNativeDriver = true): Promise<void> {
  return new Promise((resolve) => {
    Animated.timing(value, { toValue, duration, useNativeDriver }).start(() => resolve());
  });
}

type RankUpDrawerProps = {
  visible: boolean;
  onContinue: () => void;
};

export function RankUpDrawer({ visible, onContinue }: RankUpDrawerProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const borderCrossfade = useRef(new Animated.Value(0)).current; // 0 = silver, 1 = gold
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      progress.setValue(0);
      borderCrossfade.setValue(0);
      bannerOpacity.setValue(0);
      return;
    }

    let cancelled = false;

    async function run() {
      await delay(250);
      if (cancelled) return;
      await animateTo(progress, RANK_PROGRESS, BAR_FILL_MS, false);
      if (cancelled) return;
      await Promise.all([
        animateTo(borderCrossfade, 1, BORDER_CROSSFADE_MS, false),
        animateTo(bannerOpacity, 1, 260),
      ]);
    }

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const silverOpacity = borderCrossfade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <BottomSheetDrawer
      accessibilityLabel="Close rank up"
      footer={
        <Pressable
          accessibilityLabel="Continue"
          accessibilityRole="button"
          onPress={onContinue}
          style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}
        >
          <Text style={styles.continueLabel}>Continue</Text>
        </Pressable>
      }
      heightRatio={0.68}
      onClose={onContinue}
      visible={visible}
    >
      <View style={styles.content}>
        <ConfettiBurst active={visible} />

        <View style={styles.avatarWrap}>
          <Animated.View style={[styles.avatarLayer, { opacity: silverOpacity }]}>
            <RankBorderAvatar avatarUrl={TUTORIAL_USER.avatarUrl} rankTierId="silver" size={AVATAR_SIZE} />
          </Animated.View>
          <Animated.View style={[styles.avatarLayer, { opacity: borderCrossfade }]}>
            <RankBorderAvatar avatarUrl={TUTORIAL_USER.avatarUrl} rankTierId="gold" size={AVATAR_SIZE} />
          </Animated.View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionLabel}>Power Rating</Text>
          </View>
          <AnimatedXpProgressBar height={14} progress={progress} />
        </View>

        <Animated.View style={{ opacity: bannerOpacity }}>
          <XpLevelUpBanner
            level={0}
            subtitle="You're now Gold III"
            title="Rank Up!"
            visible
          />
        </Animated.View>
      </View>
    </BottomSheetDrawer>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatarLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  progressSection: {
    width: '100%',
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  continueButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentLime,
    borderRadius: 14,
    paddingVertical: spacing.md,
  },
  continueLabel: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.9,
  },
});
