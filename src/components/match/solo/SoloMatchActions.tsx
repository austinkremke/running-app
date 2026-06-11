import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../../theme';
import { OrDivider } from './OrDivider';

type SoloMatchActionStatus = 'idle' | 'searching' | 'challenge_pending';

type SoloMatchActionsProps = {
  onFindMatch: () => void;
  onChallengeFriend: () => void;
  status?: SoloMatchActionStatus;
};

export function SoloMatchActions({
  onFindMatch,
  onChallengeFriend,
  status = 'idle',
}: SoloMatchActionsProps) {
  const actionsDisabled = status !== 'idle';

  const findSubtext =
    status === 'searching'
      ? 'Searching for an opponent'
      : status === 'challenge_pending'
        ? 'Waiting on challenge response'
        : 'Find a runner of similar skill';

  const challengeSubtext =
    status === 'searching'
      ? 'Finish or cancel your current search'
      : status === 'challenge_pending'
        ? 'Challenge invite already sent'
        : 'Send a 1v1 challenge to a friend';
  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityLabel="Find match"
        accessibilityRole="button"
        accessibilityState={{ disabled: actionsDisabled }}
        disabled={actionsDisabled}
        onPress={onFindMatch}
        style={({ pressed }) => [
          styles.findButton,
          actionsDisabled && styles.findButtonDisabled,
          pressed && !actionsDisabled ? styles.pressed : null,
        ]}
      >
        <Ionicons
          color={actionsDisabled ? colors.textSecondary : colors.background}
          name="footsteps"
          size={18}
        />
        <View style={styles.textBlock}>
          <Text style={[styles.findLabel, actionsDisabled && styles.findLabelDisabled]}>
            Find Match
          </Text>
          <Text style={[styles.findSubtext, actionsDisabled && styles.findSubtextDisabled]}>
            {findSubtext}
          </Text>
        </View>
      </Pressable>

      <OrDivider />

      <Pressable
        accessibilityLabel="Challenge friend"
        accessibilityRole="button"
        accessibilityState={{ disabled: actionsDisabled }}
        disabled={actionsDisabled}
        onPress={onChallengeFriend}
        style={({ pressed }) => [
          styles.challengeButton,
          actionsDisabled && styles.challengeButtonDisabled,
          pressed && !actionsDisabled ? styles.pressed : null,
        ]}
      >
        <Ionicons
          color={actionsDisabled ? colors.textSecondary : colors.accentLime}
          name="people-outline"
          size={18}
        />
        <View style={styles.textBlock}>
          <Text style={[styles.challengeLabel, actionsDisabled && styles.challengeLabelDisabled]}>
            Challenge Friend
          </Text>
          <Text style={styles.challengeSubtext}>{challengeSubtext}</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  findButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentLime,
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  findButtonDisabled: {
    backgroundColor: colors.surfaceElevated,
    opacity: 0.7,
  },
  challengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.accentLime,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  challengeButtonDisabled: {
    borderColor: colors.border,
    opacity: 0.7,
  },
  textBlock: {
    alignItems: 'center',
    gap: 2,
  },
  findLabel: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  findLabelDisabled: {
    color: colors.textSecondary,
  },
  findSubtext: {
    color: colors.background,
    fontSize: 10,
    opacity: 0.8,
  },
  findSubtextDisabled: {
    color: colors.textSecondary,
    opacity: 1,
  },
  challengeLabel: {
    color: colors.accentLime,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  challengeLabelDisabled: {
    color: colors.textSecondary,
  },
  challengeSubtext: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  pressed: {
    opacity: 0.9,
  },
});
