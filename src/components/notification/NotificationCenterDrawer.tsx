import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { AppNotification } from '../../hooks/useTeamNotifications';
import { colors, spacing } from '../../theme';
import { BottomSheetDrawer } from '../drawer';
import { TeamAvatar } from '../team/TeamAvatar';

type NotificationCenterDrawerProps = {
  visible: boolean;
  notifications: AppNotification[];
  loading?: boolean;
  actionLoadingId?: string | null;
  onRespond: (notification: AppNotification, accept: boolean) => void;
  onClose: () => void;
};

function primaryLabel(notification: AppNotification): string {
  return notification.kind === 'invite' ? 'Join' : 'Approve';
}

export function NotificationCenterDrawer({
  visible,
  notifications,
  loading = false,
  actionLoadingId = null,
  onRespond,
  onClose,
}: NotificationCenterDrawerProps) {
  return (
    <BottomSheetDrawer heightRatio={0.62} onClose={onClose} visible={visible}>
      <View style={styles.container}>
        <Text style={styles.title}>Notifications</Text>

        {loading && notifications.length === 0 ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : notifications.length === 0 ? (
          <Text style={styles.empty}>You’re all caught up.</Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.list}>
              {notifications.map((notification) => {
                const busy = actionLoadingId === notification.id;
                const isInvite = notification.kind === 'invite';

                return (
                  <View key={notification.id} style={styles.row}>
                    <TeamAvatar
                      accent={notification.teamLogoAccent}
                      icon={notification.teamLogoIcon}
                      imageUrl={notification.teamLogoUrl}
                      size={34}
                    />

                    <View style={styles.meta}>
                      <Text numberOfLines={2} style={styles.message}>
                        {isInvite ? (
                          <>
                            <Text style={styles.strong}>{notification.teamName}</Text> invited you to
                            join
                          </>
                        ) : (
                          <>
                            <Text style={styles.strong}>{notification.actorName}</Text> wants to join{' '}
                            <Text style={styles.strong}>{notification.teamName}</Text>
                          </>
                        )}
                      </Text>
                      <Text style={styles.sub}>
                        {isInvite
                          ? `From ${notification.actorName} · Lvl ${notification.actorLevel}`
                          : `Level ${notification.actorLevel}`}
                      </Text>
                    </View>

                    <View style={styles.actions}>
                      <Pressable
                        accessibilityLabel="Decline"
                        accessibilityRole="button"
                        disabled={busy}
                        onPress={() => onRespond(notification, false)}
                        style={({ pressed }) => [
                          styles.declineButton,
                          busy && styles.buttonDisabled,
                          pressed && !busy ? styles.pressed : null,
                        ]}
                      >
                        <Text style={styles.declineLabel}>Decline</Text>
                      </Pressable>
                      <Pressable
                        accessibilityLabel={primaryLabel(notification)}
                        accessibilityRole="button"
                        disabled={busy}
                        onPress={() => onRespond(notification, true)}
                        style={({ pressed }) => [
                          styles.acceptButton,
                          busy && styles.buttonDisabled,
                          pressed && !busy ? styles.pressed : null,
                        ]}
                      >
                        <Text style={styles.acceptLabel}>{primaryLabel(notification)}</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </BottomSheetDrawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  empty: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  message: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  strong: {
    fontWeight: '800',
    fontStyle: 'italic',
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  declineButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  acceptButton: {
    borderRadius: 10,
    backgroundColor: colors.accentLime,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  declineLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  acceptLabel: {
    color: colors.background,
    fontSize: 11,
    fontWeight: '800',
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.85,
  },
});
