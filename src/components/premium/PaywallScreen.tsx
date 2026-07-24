import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RevenueCatUI, { CustomVariableValue } from 'react-native-purchases-ui';

import { usePurchases } from '../../context';
import { colors, spacing } from '../../theme';

type PaywallScreenProps = {
  onClose: () => void;
  /** Context-specific line, e.g. "Unlock in-depth personal best tracking and more!" — passed
   * to the RevenueCat dashboard paywall template as {{ custom.context_message }}, and shown
   * directly in the fallback UI when no offering/template is configured yet. */
  message: string;
};

/** A dedicated full-screen paywall — not a modal/overlay stacked on top of
 * other content, which was causing transition glitches when dismissed.
 *
 * Renders RevenueCat's hosted paywall template (configured in the dashboard) once an
 * offering exists; falls back to a minimal hand-built screen before any RevenueCat
 * products/templates are configured, so the flow is previewable either way. */
export function PaywallScreen({ onClose, message }: PaywallScreenProps) {
  const { offering } = usePurchases();

  if (offering) {
    return (
      <RevenueCatUI.Paywall
        onDismiss={onClose}
        onPurchaseCompleted={onClose}
        onRestoreCompleted={onClose}
        options={{
          offering,
          customVariables: { context_message: CustomVariableValue.string(message) },
        }}
        style={styles.fill}
      />
    );
  }

  return <FallbackPaywall message={message} onClose={onClose} />;
}

/** Shown before a RevenueCat offering/paywall template exists — same copy, no live products. */
function FallbackPaywall({ onClose, message }: PaywallScreenProps) {
  const { purchasePackage, restorePurchases } = usePurchases();
  const [isPurchasing, setIsPurchasing] = useState(false);

  async function handleStartTrial() {
    Alert.alert('Coming soon', 'Purchases are not configured yet.');
  }

  async function handleRestore() {
    try {
      setIsPurchasing(true);
      await restorePurchases();
      onClose();
    } catch (error) {
      Alert.alert('Restore failed', 'Something went wrong. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Go back" accessibilityRole="button" hitSlop={8} onPress={onClose}>
          <Ionicons color={colors.textPrimary} name="chevron-back" size={22} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.iconBadge}>
          <Ionicons color={colors.background} name="sparkles" size={26} />
        </View>
        <Text style={styles.title}>Compete at your full potential with Run Off Premium</Text>
        <Text style={styles.message}>{message}</Text>

        <Pressable
          accessibilityRole="button"
          disabled={isPurchasing}
          onPress={handleStartTrial}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          {isPurchasing ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.ctaText}>Start Free Trial</Text>
          )}
        </Pressable>

        <Pressable accessibilityRole="button" hitSlop={8} onPress={handleRestore}>
          <Text style={styles.restoreText}>Restore purchases</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentLime,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 28,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  cta: {
    alignSelf: 'stretch',
    backgroundColor: colors.accentLime,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
  },
  restoreText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginTop: spacing.xs,
  },
});
