import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { SoloProfileCard } from '../match/solo/SoloProfileCard';
import { BottomSheetDrawer } from '../drawer';
import type { OnboardingNpcOpponent } from '../../mock/onboardingNpc';
import { colors, spacing } from '../../theme';
import { OnboardingAuthButton } from './OnboardingAuthButton';
import { OnboardingPrimaryButton } from './OnboardingPrimaryButton';

type OnboardingChallengeDrawerProps = {
  visible: boolean;
  opponent: OnboardingNpcOpponent;
  onAccept: () => void;
  onRunLater: () => void;
};

export function OnboardingChallengeDrawer({
  visible,
  opponent,
  onAccept,
  onRunLater,
}: OnboardingChallengeDrawerProps) {
  return (
    <BottomSheetDrawer
      accessibilityLabel="Dismiss challenge"
      heightRatio={0.58}
      onClose={onRunLater}
      visible={visible}
      footer={
        <View style={styles.footer}>
          <OnboardingPrimaryButton label="ACCEPT CHALLENGE" onPress={onAccept} />
          <OnboardingAuthButton label="I'LL RUN LATER" onPress={onRunLater} variant="outline" />
        </View>
      }
    >
      <View style={styles.content}>
        <Text style={styles.eyebrow}>NEW CHALLENGE</Text>
        <Text style={styles.message}>
          <Text style={styles.messageName}>{opponent.name}</Text>
          {' has challenged you to a Run Off. Complete your first running workout to get ahead of the competition!'}
        </Text>

        <SoloProfileCard
          avatarUrl={opponent.avatarUrl}
          level={opponent.level}
          name={opponent.name}
          rankIcon={opponent.rankIcon}
          rankTitle={opponent.rankTitle}
        />

        <View style={styles.challengeTypeCard}>
          <View style={styles.challengeIconWrap}>
            <Ionicons color={colors.accentLime} name="footsteps" size={20} />
          </View>
          <View style={styles.challengeCopy}>
            <Text style={styles.challengeLabel}>SINGLE RUN CHALLENGE</Text>
            <Text style={styles.challengeBody}>
              Run further and faster than your opponent to claim the victory!
            </Text>
          </View>
        </View>
      </View>
    </BottomSheetDrawer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
  eyebrow: {
    color: colors.accentLime,
    fontSize: 11,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 1.2,
  },
  message: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  messageName: {
    color: colors.accentLime,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  challengeTypeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accentLime,
    padding: spacing.md,
  },
  challengeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.accentLime,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  challengeCopy: {
    flex: 1,
    gap: 4,
  },
  challengeLabel: {
    color: colors.accentLime,
    fontSize: 11,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.8,
  },
  challengeBody: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
