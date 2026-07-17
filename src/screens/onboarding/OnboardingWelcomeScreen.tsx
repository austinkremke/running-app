import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CarouselDots, LifestyleCarousel } from '../../components/onboarding';
import { colors, spacing } from '../../theme';

const SLIDE_COUNT = 4;

type OnboardingWelcomeScreenProps = {
  onJoin: () => void;
  onLogin: () => void;
};

export function OnboardingWelcomeScreen({ onJoin, onLogin }: OnboardingWelcomeScreenProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  // Close to the source photos' native 2:3 aspect ratio so `cover` doesn't
  // have to crop much off the top/bottom.
  const photoHeight = windowHeight * 0.64;

  return (
    <View style={styles.root}>
      <LifestyleCarousel
        activeIndex={activeIndex}
        onIndexChange={setActiveIndex}
        photoHeight={photoHeight}
      />

      <View style={styles.dotsRow}>
        <CarouselDots activeIndex={activeIndex} count={SLIDE_COUNT} />
      </View>

      <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="Join for free"
            accessibilityRole="button"
            onPress={onJoin}
            style={({ pressed }) => [styles.joinButton, pressed && styles.pressed]}
          >
            <Text style={styles.joinLabel}>Join for Free</Text>
          </Pressable>

          <Pressable
            accessibilityLabel="Log in"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onLogin}
            style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}
          >
            <Text style={styles.loginLabel}>Log in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dotsRow: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: 16,
  },
  bottomSafe: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  joinButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentLime,
    borderRadius: 999,
    paddingVertical: spacing.lg,
  },
  joinLabel: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  loginButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  loginLabel: {
    color: colors.accentLime,
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  pressed: {
    opacity: 0.85,
  },
});
