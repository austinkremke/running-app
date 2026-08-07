import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LEGAL_LINKS } from '../../config/appMeta';
import { colors, spacing } from '../../theme';

type OnboardingTermsScreenProps = {
  onAccept: () => void;
};

async function openUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch (error) {
    console.warn('Could not open link', error);
  }
}

export function OnboardingTermsScreen({ onAccept }: OnboardingTermsScreenProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Before You Continue</Text>

        <View style={styles.card}>
          <Text style={styles.body}>
            Run Off is a community of runners sharing real activity, photos, and messages. To keep it
            safe:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>
              • We have zero tolerance for objectionable content or abusive behavior of any kind.
            </Text>
            <Text style={styles.bullet}>
              • You can report any post, comment, or message you believe violates this.
            </Text>
            <Text style={styles.bullet}>
              • You can block any user — you'll stop seeing their content immediately, and they'll
              stop seeing yours.
            </Text>
            <Text style={styles.bullet}>
              • We review reports and remove violating content and accounts.
            </Text>
          </View>
          <Text style={styles.body}>
            By continuing, you agree to our Terms of Use and Privacy Policy.
          </Text>
        </View>

        <View style={styles.linkRow}>
          <Pressable
            accessibilityRole="link"
            onPress={() => {
              void openUrl(LEGAL_LINKS.termsOfService);
            }}
          >
            <Text style={styles.link}>Terms of Use</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            onPress={() => {
              void openUrl(LEGAL_LINKS.privacyPolicy);
            }}
          >
            <Text style={styles.link}>Privacy Policy</Text>
          </Pressable>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="I agree to the Terms of Use and Privacy Policy"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            hitSlop={8}
            onPress={() => setAgreed((value) => !value)}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed ? <Ionicons color={colors.background} name="checkmark" size={16} /> : null}
            </View>
            <Text style={styles.checkboxLabel}>
              I agree to the Terms of Use and understand there is zero tolerance for objectionable
              content or abusive users.
            </Text>
          </Pressable>

          <Pressable
            accessibilityLabel="Continue"
            accessibilityRole="button"
            disabled={!agreed}
            onPress={onAccept}
            style={({ pressed }) => [
              styles.continueButton,
              !agreed && styles.continueButtonDisabled,
              pressed && agreed && styles.pressed,
            ]}
          >
            <Text style={styles.continueLabel}>Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  bulletList: {
    gap: spacing.sm,
  },
  bullet: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  linkRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  link: {
    color: colors.accentLime,
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  bottomSafe: {
    justifyContent: 'flex-end',
  },
  actions: {
    width: '100%',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.accentLime,
    borderColor: colors.accentLime,
  },
  checkboxLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  continueButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentLime,
    borderRadius: 999,
    paddingVertical: spacing.lg,
  },
  continueButtonDisabled: {
    opacity: 0.35,
  },
  continueLabel: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});
