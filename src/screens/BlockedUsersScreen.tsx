import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBlockedUsers } from '../context';
import { fetchBlockedUsers, type BlockedUserProfile } from '../services/moderationService';
import { colors, spacing } from '../theme';

type BlockedUsersScreenProps = {
  onBack: () => void;
};

export function BlockedUsersScreen({ onBack }: BlockedUsersScreenProps) {
  const { unblock } = useBlockedUsers();
  const [users, setUsers] = useState<BlockedUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchBlockedUsers();
      setUsers(next);
    } catch (error) {
      console.warn('Failed to load blocked users', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUnblock(userId: string) {
    setUnblockingId(userId);
    try {
      await unblock(userId);
      setUsers((previous) => previous.filter((user) => user.id !== userId));
    } catch (error) {
      console.warn('Failed to unblock user', error);
    } finally {
      setUnblockingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Back" accessibilityRole="button" hitSlop={8} onPress={onBack}>
          <Ionicons color={colors.textPrimary} name="chevron-back" size={24} />
        </Pressable>
        <Text style={styles.title}>BLOCKED USERS</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accentLime} />
        </View>
      ) : users.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.empty}>You haven't blocked anyone.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {users.map((user) => (
            <View key={user.id} style={styles.row}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]} />
              )}
              <Text style={styles.name}>{user.displayName}</Text>
              <Pressable
                accessibilityLabel={`Unblock ${user.displayName}`}
                accessibilityRole="button"
                disabled={unblockingId === user.id}
                onPress={() => void handleUnblock(user.id)}
                style={({ pressed }) => [styles.unblockButton, pressed && styles.pressed]}
              >
                <Text style={styles.unblockLabel}>
                  {unblockingId === user.id ? '…' : 'Unblock'}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.6,
  },
  headerSpacer: {
    width: 24,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  empty: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
  },
  avatarPlaceholder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  unblockButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  unblockLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.85,
  },
});
