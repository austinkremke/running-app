import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheetDrawer } from '../drawer';
import type { ReceivedSoloChallenge } from '../../services/challengeService';
import type { InAppNotification, InAppNotificationAction } from '../../types/inAppNotification';
import { colors, spacing } from '../../theme';

const AVATAR_SIZE = 56;

type InAppNotificationDrawerProps = {
  notification: InAppNotification | null;
  visible: boolean;
  actionLoading?: boolean;
  onClose: () => void;
};

function NotificationActionButton({
  action,
  disabled,
}: {
  action: InAppNotificationAction;
  disabled?: boolean;
}) {
  const isPrimary = action.variant === 'primary' || action.variant == null;
  const isDanger = action.variant === 'danger';

  return (
    <Pressable
      accessibilityLabel={action.label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        void action.onPress();
      }}
      style={({ pressed }) => [
        styles.actionButton,
        isPrimary && styles.actionPrimary,
        isDanger && styles.actionDanger,
        !isPrimary && !isDanger && styles.actionSecondary,
        disabled && styles.actionDisabled,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      <Text
        style={[
          styles.actionLabel,
          isPrimary && styles.actionLabelPrimary,
          isDanger && styles.actionLabelDanger,
          !isPrimary && !isDanger && styles.actionLabelSecondary,
        ]}
      >
        {action.label}
      </Text>
    </Pressable>
  );
}

export function InAppNotificationDrawer({
  notification,
  visible,
  actionLoading = false,
  onClose,
}: InAppNotificationDrawerProps) {
  if (!notification) {
    return null;
  }

  const footer =
    notification.kind === 'generic' && notification.footer ? (
      notification.footer
    ) : notification.primaryAction || notification.secondaryAction ? (
      <View style={styles.actions}>
        {notification.secondaryAction ? (
          <NotificationActionButton action={notification.secondaryAction} disabled={actionLoading} />
        ) : null}
        {notification.primaryAction ? (
          <NotificationActionButton action={notification.primaryAction} disabled={actionLoading} />
        ) : null}
      </View>
    ) : null;

  return (
    <BottomSheetDrawer
      accessibilityLabel="Dismiss notification"
      footer={footer}
      heightRatio={notification.heightRatio ?? 0.52}
      onClose={onClose}
      visible={visible}
    >
      <View style={styles.content}>
        {notification.eyebrow ? <Text style={styles.eyebrow}>{notification.eyebrow}</Text> : null}

        {notification.avatarUrl || notification.avatarFallbackLabel ? (
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrap}>
              {notification.avatarUrl ? (
                <Image source={{ uri: notification.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>
                    {(notification.avatarFallbackLabel ?? '?').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.avatarMeta}>
              <Text style={styles.title}>{notification.title}</Text>
              {notification.meta ? <Text style={styles.meta}>{notification.meta}</Text> : null}
            </View>
          </View>
        ) : (
          <Text style={styles.titleStandalone}>{notification.title}</Text>
        )}

        {notification.message ? <Text style={styles.message}>{notification.message}</Text> : null}

        {notification.detail ? <View style={styles.detail}>{notification.detail}</View> : null}

        {notification.kind === 'generic' && notification.body ? (
          <View style={styles.detail}>{notification.body}</View>
        ) : null}

        {actionLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accentLime} size="small" />
          </View>
        ) : null}
      </View>
    </BottomSheetDrawer>
  );
}

function SoloChallengeDetail() {
  return (
    <View style={styles.challengeDetailCard}>
      <View style={styles.challengeIconWrap}>
        <Ionicons color={colors.accentLime} name="footsteps" size={18} />
      </View>
      <View style={styles.challengeCopy}>
        <Text style={styles.challengeLabel}>1V1 SOLO MATCH</Text>
        <Text style={styles.challengeBody}>
          Run further and score more points than your opponent before the match timer ends.
        </Text>
      </View>
    </View>
  );
}

export function buildSoloChallengeNotification(
  challenge: ReceivedSoloChallenge,
  actions: {
    onAccept: () => void | Promise<void>;
    onDecline: () => void | Promise<void>;
    onDismiss?: () => void;
  },
): InAppNotification {
  return {
    kind: 'solo_challenge',
    id: `solo_challenge:${challenge.id}`,
    challengeId: challenge.id,
    challenger: challenge.challenger,
    eyebrow: 'NEW CHALLENGE',
    title: challenge.challenger.name,
    meta: `Level ${challenge.challenger.level}`,
    avatarUrl: challenge.challenger.avatarUrl,
    avatarFallbackLabel: challenge.challenger.name,
    message: `${challenge.challenger.name} challenged you to a ranked 1v1 solo match.`,
    detail: <SoloChallengeDetail />,
    primaryAction: {
      label: 'Accept',
      variant: 'primary',
      onPress: actions.onAccept,
    },
    secondaryAction: {
      label: 'Decline',
      variant: 'secondary',
      onPress: actions.onDecline,
    },
    onDismiss: actions.onDismiss,
    heightRatio: 0.56,
  };
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  eyebrow: {
    color: colors.accentLime,
    fontSize: 10,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 1,
    textAlign: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  avatarInitial: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  avatarMeta: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  titleStandalone: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  detail: {
    gap: spacing.sm,
  },
  challengeDetailCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  challengeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 10,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.6,
  },
  challengeBody: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  loadingRow: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: spacing.md,
  },
  actionPrimary: {
    backgroundColor: colors.accentLime,
  },
  actionDanger: {
    backgroundColor: colors.danger,
  },
  actionSecondary: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionDisabled: {
    opacity: 0.6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  actionLabelPrimary: {
    color: colors.background,
  },
  actionLabelDanger: {
    color: colors.textPrimary,
  },
  actionLabelSecondary: {
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.85,
  },
});
