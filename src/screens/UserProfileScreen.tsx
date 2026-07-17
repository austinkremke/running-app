import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OverallStatsSection, ProfileTopSection, StatDetailDrawer, type StatDetailTarget } from '../components/me';
import { HeaderIconButton } from '../components/header';
import { useUserId } from '../context';
import { useFriends } from '../hooks/useFriends';
import { useOtherUserProfile } from '../hooks/useOtherUserProfile';
import type { OverallStat } from '../mock';
import { buildOverallStats } from '../services/buildOverallStats';
import { colors, spacing } from '../theme';
import { getErrorMessage } from '../utils/errors';

type UserProfileScreenProps = {
  userId: string;
  onBack?: () => void;
};

export function UserProfileScreen({ userId, onBack }: UserProfileScreenProps) {
  const viewerUserId = useUserId();
  const { profile, seasonRecord, overallStats, loading } = useOtherUserProfile(userId);
  const { isFriend, isPending, sendFriendRequestTo, removeFriendById } = useFriends();
  const [statDetailTarget, setStatDetailTarget] = useState<StatDetailTarget | null>(null);
  const [friendActionBusy, setFriendActionBusy] = useState(false);

  const isSelf = viewerUserId === userId;
  const friends = !isSelf && isFriend(userId);
  const pending = !isSelf && !friends && isPending(userId);

  function handleStatPress(stat: OverallStat) {
    if (!stat.metricKey) return;
    setStatDetailTarget({
      metricKey: stat.metricKey,
      label: stat.label,
      lifetimeValue: stat.unit ? `${stat.value} ${stat.unit}` : stat.value,
    });
  }

  async function handleAddFriend() {
    setFriendActionBusy(true);
    try {
      await sendFriendRequestTo(userId);
    } catch (error) {
      Alert.alert('Could not send friend request', getErrorMessage(error, 'Something went wrong.'));
    } finally {
      setFriendActionBusy(false);
    }
  }

  function confirmRemoveFriend() {
    Alert.alert('Remove friend', `Remove ${profile?.name ?? 'this runner'} as a friend?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setFriendActionBusy(true);
            try {
              await removeFriendById(userId);
            } catch (error) {
              Alert.alert('Could not remove friend', getErrorMessage(error, 'Something went wrong.'));
            } finally {
              setFriendActionBusy(false);
            }
          })();
        },
      },
    ]);
  }

  function handleOpenProfileMenu() {
    Alert.alert(profile?.name ?? 'Profile options', undefined, [
      { text: 'Remove Friend', style: 'destructive', onPress: confirmRemoveFriend },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <HeaderIconButton accessibilityLabel="Go back" icon="chevron-back" onPress={onBack} />
        <Text numberOfLines={1} style={styles.headerTitle}>
          {profile?.name ?? 'Profile'}
        </Text>
        {friends ? (
          <HeaderIconButton
            accessibilityLabel="Profile options"
            icon="ellipsis-vertical"
            onPress={handleOpenProfileMenu}
          />
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accentLime} />
        </View>
      ) : profile ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!isSelf && !friends ? (
            <Pressable
              accessibilityLabel={pending ? 'Friend request pending' : 'Add friend'}
              accessibilityRole="button"
              disabled={friendActionBusy || pending}
              onPress={friendActionBusy || pending ? undefined : () => void handleAddFriend()}
              style={({ pressed }) => [
                styles.addFriendButton,
                (friendActionBusy || pending) && styles.addFriendButtonDisabled,
                pressed && !friendActionBusy && !pending && styles.pressed,
              ]}
            >
              <Ionicons color={colors.background} name="person-add" size={16} />
              <Text style={styles.addFriendLabel}>
                {pending ? 'Pending' : friendActionBusy ? 'Sending…' : 'Add Friend'}
              </Text>
            </Pressable>
          ) : null}

          <ProfileTopSection
            profile={{
              name: profile.name,
              avatarUrl: profile.avatarUrl,
              clanName: profile.teamName,
              level: profile.level,
              rank: profile.rank,
            }}
          />

          {overallStats ? (
            <OverallStatsSection
              onStatPress={handleStatPress}
              stats={buildOverallStats(overallStats, seasonRecord)}
            />
          ) : null}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      ) : (
        <View style={styles.loading}>
          <Text style={styles.errorText}>Couldn't load this profile.</Text>
        </View>
      )}

      <StatDetailDrawer
        onClose={() => setStatDetailTarget(null)}
        target={statDetailTarget}
        userId={userId}
        visible={statDetailTarget != null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  headerSpacer: {
    width: 40,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentLime,
    borderRadius: 12,
    paddingVertical: spacing.md,
  },
  addFriendButtonDisabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
  },
  addFriendLabel: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  bottomSpacer: {
    height: spacing.md,
  },
});
