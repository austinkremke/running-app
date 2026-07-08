import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../../theme';

type OnboardingStepContainerProps = {
  stepKey: string;
  headline: string;
  supportingCopy: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function OnboardingStepContainer({
  stepKey,
  headline,
  supportingCopy,
  children,
  footer,
}: OnboardingStepContainerProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(16);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 16,
        bounciness: 4,
      }),
    ]).start();
    // Re-run whenever the step changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animated, { opacity, transform: [{ translateY }] }]}>
        <View style={styles.header}>
          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.supportingCopy}>{supportingCopy}</Text>
        </View>

        <View style={styles.visual}>{children}</View>
      </Animated.View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  animated: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.xs,
  },
  headline: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
  supportingCopy: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 320,
  },
  visual: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
});
