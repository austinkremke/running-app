import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { NotificationPreferenceRow, SettingsRow, SettingsSection, UnitToggle } from '../components/settings';
import { APP_VERSION, LEGAL_LINKS } from '../config/appMeta';
import { useAuth } from '../context';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import { useUserPreferences } from '../hooks/useUserPreferences';
import type { NotificationCategory } from '../services/pushNotifications';
import { deleteOwnAccount, getLinkedProviders } from '../services/accountService';
import {
  buildActivityRecordsForWorkout,
  fetchRecentHealthKitWorkoutProxies,
  fetchRecentHeartRateSamplesUnfiltered,
  isHealthKitAvailable,
  requestHealthKitReadAccess,
  summarizeHealthKitWorkout,
} from '../services/healthKitService';
import { syncHealthKitWorkouts } from '../services/healthKitSyncService';
import { initialsFromDisplayName, pickProfilePhotoUri, uploadProfileAvatar } from '../services/profileAvatar';
import { updateDisplayName } from '../services/profileService';
import { colors, spacing } from '../theme';

type SettingsScreenProps = {
  onBack?: () => void;
};

const NOTIFICATION_CATEGORY_LABELS: { category: NotificationCategory; label: string }[] = [
  { category: 'likes', label: 'Likes on your runs' },
  { category: 'comments', label: 'Comments on your runs' },
  { category: 'friend_requests', label: 'Friend requests' },
  { category: 'friend_challenge', label: 'Friend challenges' },
  { category: 'match_found', label: 'Match found' },
  { category: 'match_reminders', label: 'Time left in match' },
  { category: 'match_complete', label: 'Match results' },
  { category: 'friend_activity', label: 'Friend completed a run' },
];

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { session, gameState, signOut, refreshGameState } = useAuth();
  const { preferences, setDistanceUnit } = useUserPreferences();
  const {
    preferences: notificationPreferences,
    savingCategory,
    setCategory: setNotificationCategory,
  } = useNotificationPreferences();
  const userId = session?.user?.id ?? null;
  const [notificationCategoriesExpanded, setNotificationCategoriesExpanded] = useState(false);
  const [healthKitSyncStatus, setHealthKitSyncStatus] = useState('Tap to sync');

  async function handleSyncHealthKit() {
    if (!isHealthKitAvailable()) {
      setHealthKitSyncStatus('Not available on this device');
      return;
    }
    if (!userId) {
      setHealthKitSyncStatus('Sign in required');
      return;
    }

    setHealthKitSyncStatus('Requesting access…');
    try {
      const granted = await requestHealthKitReadAccess();
      if (!granted) {
        setHealthKitSyncStatus('Access denied');
        return;
      }

      setHealthKitSyncStatus('Syncing…');
      const result = await syncHealthKitWorkouts(userId);

      const parts = [`Synced ${result.syncedCount}`];
      if (result.skippedDuplicateCount > 0) parts.push(`${result.skippedDuplicateCount} duplicate(s) skipped`);
      if (result.errorCount > 0) parts.push(`${result.errorCount} failed`);
      setHealthKitSyncStatus(parts.join(' · '));
    } catch (error) {
      setHealthKitSyncStatus(error instanceof Error ? error.message : 'Sync failed');
    }
  }

  const [healthKitTestStatus, setHealthKitTestStatus] = useState('Tap to run');

  async function handleTestHealthKit() {
    if (!isHealthKitAvailable()) {
      setHealthKitTestStatus('Not available on this device');
      return;
    }

    setHealthKitTestStatus('Requesting access…');
    try {
      const granted = await requestHealthKitReadAccess();
      if (!granted) {
        setHealthKitTestStatus('Access denied');
        return;
      }

      const workoutProxies = await fetchRecentHealthKitWorkoutProxies(10);
      const workouts = await Promise.all(
        workoutProxies.map(async (workout) => ({
          summary: summarizeHealthKitWorkout(workout),
          records: await buildActivityRecordsForWorkout(workout),
        })),
      );

      setHealthKitTestStatus(`Found ${workouts.length} recent workout(s)`);
      console.log(
        '[HealthKit smoke test] recent workouts',
        workouts.map(({ summary, records }) => ({
          ...summary,
          recordCount: records.length,
          hasRoute: records.some((r) => r.latitude != null),
          heartRateRecordCount: records.filter((r) => r.heartRateBpm != null).length,
          heartRateBpmValues: records.filter((r) => r.heartRateBpm != null).map((r) => r.heartRateBpm),
          firstRecord: records[0],
          lastRecord: records[records.length - 1],
        })),
      );

      const unfilteredHr = await fetchRecentHeartRateSamplesUnfiltered(24);
      console.log('[HealthKit smoke test] unfiltered HR samples, last 24h', {
        count: unfilteredHr.length,
        samples: unfilteredHr,
      });
    } catch (error) {
      setHealthKitTestStatus(error instanceof Error ? error.message : 'Failed');
    }
  }

  const [displayName, setDisplayName] = useState(gameState?.profile.display_name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const linkedProviders = getLinkedProviders(session);
  const avatarUrl = gameState?.profile.avatar_url ?? undefined;
  const initials = initialsFromDisplayName(gameState?.profile.display_name);

  async function handleSaveName() {
    if (!userId) {
      return;
    }

    setSavingName(true);
    try {
      await updateDisplayName(userId, displayName);
      await refreshGameState();
    } catch (error) {
      Alert.alert(
        'Could not save name',
        error instanceof Error ? error.message : 'Try again.',
      );
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangeAvatar() {
    if (!userId) {
      return;
    }

    setUploadingAvatar(true);
    try {
      const picked = await pickProfilePhotoUri();
      if (picked.canceled) {
        return;
      }

      await uploadProfileAvatar(userId, picked.uri);
      await refreshGameState();
    } catch (error) {
      Alert.alert(
        'Could not update photo',
        error instanceof Error ? error.message : 'Try again.',
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      onBack?.();
    } catch (error) {
      Alert.alert(
        'Sign out failed',
        error instanceof Error ? error.message : 'Try again.',
      );
    }
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your profile, runs, and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => {
            void handleDeleteAccount();
          },
        },
      ],
    );
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    try {
      await deleteOwnAccount();
      await signOut();
      onBack?.();
    } catch (error) {
      Alert.alert(
        'Delete failed',
        error instanceof Error ? error.message : 'Could not delete your account.',
      );
    } finally {
      setDeletingAccount(false);
    }
  }

  async function openUrl(url: string) {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn('Could not open link', error);
    }
  }

  const nameChanged =
    displayName.trim() !== (gameState?.profile.display_name ?? '').trim() && displayName.trim().length > 0;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      <SettingsSection title="Profile">
        <View style={styles.profileBlock}>
          <Pressable
            accessibilityLabel="Change profile photo"
            accessibilityRole="button"
            disabled={uploadingAvatar}
            onPress={() => {
              void handleChangeAvatar();
            }}
            style={styles.avatarButton}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              {uploadingAvatar ? (
                <ActivityIndicator color={colors.textPrimary} size="small" />
              ) : (
                <Ionicons color={colors.textPrimary} name="camera" size={14} />
              )}
            </View>
          </Pressable>

          <View style={styles.nameField}>
            <Text style={styles.fieldLabel}>Display name</Text>
            <TextInput
              autoCapitalize="words"
              autoCorrect={false}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={displayName}
            />
            <Pressable
              accessibilityRole="button"
              disabled={!nameChanged || savingName}
              onPress={() => {
                void handleSaveName();
              }}
              style={({ pressed }) => [
                styles.saveButton,
                (!nameChanged || savingName) && styles.saveButtonDisabled,
                pressed && nameChanged && !savingName && styles.pressed,
              ]}
            >
              {savingName ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={styles.saveButtonLabel}>Save name</Text>
              )}
            </Pressable>
          </View>
        </View>
      </SettingsSection>

      <SettingsSection title="Preferences">
        <UnitToggle
          onChange={(unit) => {
            void setDistanceUnit(unit);
          }}
          value={preferences.distanceUnit}
        />
        <Text style={styles.helper}>
          Distance unit preference is saved on this device. Run displays will adopt this in a future
          update.
        </Text>
      </SettingsSection>

      <SettingsSection title="Apple Health">
        <SettingsRow
          icon="fitness-outline"
          label="Sync Apple Watch & Garmin runs"
          onPress={() => void handleSyncHealthKit()}
          value={healthKitSyncStatus}
        />
        <Text style={styles.helper}>
          Pulls in recent workouts synced to Apple Health from Apple Watch or Garmin. Runs without
          heart-rate data won't earn XP or count in matches.
        </Text>
      </SettingsSection>

      {__DEV__ ? (
        <SettingsSection title="Apple Health (Dev)">
          <SettingsRow
            icon="bug-outline"
            label="Test HealthKit connection (debug log)"
            onPress={() => void handleTestHealthKit()}
            value={healthKitTestStatus}
          />
        </SettingsSection>
      ) : null}

      <SettingsSection title="Notifications">
        <SettingsRow
          icon="notifications-outline"
          label="System notification settings"
          onPress={() => {
            void Linking.openSettings();
          }}
          value="Manage alerts in iOS Settings"
        />
        <SettingsRow
          icon={notificationCategoriesExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
          label="Notification categories"
          onPress={() => setNotificationCategoriesExpanded((expanded) => !expanded)}
          showChevron={false}
          value={notificationCategoriesExpanded ? 'Tap to collapse' : `Tap to expand (${NOTIFICATION_CATEGORY_LABELS.length})`}
        />
        {notificationCategoriesExpanded
          ? NOTIFICATION_CATEGORY_LABELS.map(({ category, label }) => (
              <NotificationPreferenceRow
                disabled={savingCategory === category}
                key={category}
                label={label}
                onChange={(value) => void setNotificationCategory(category, value)}
                value={notificationPreferences[category]}
              />
            ))
          : null}
      </SettingsSection>

      <SettingsSection title="Linked sign-in">
        {linkedProviders.length > 0 ? (
          linkedProviders.map((provider, index) => (
            <SettingsRow
              key={provider.id}
              icon={provider.id === 'apple' ? 'logo-apple' : provider.id === 'google' ? 'logo-google' : 'mail-outline'}
              label={provider.label}
              showChevron={false}
              value={provider.detail}
            />
          ))
        ) : (
          <SettingsRow icon="person-outline" label="No linked providers" showChevron={false} />
        )}
      </SettingsSection>

      <SettingsSection title="Account">
        <SettingsRow icon="log-out-outline" label="Sign out" onPress={() => void handleSignOut()} />
        <SettingsRow
          destructive
          disabled={deletingAccount}
          icon="trash-outline"
          label={deletingAccount ? 'Deleting account…' : 'Delete account'}
          onPress={confirmDeleteAccount}
          showChevron={false}
        />
      </SettingsSection>

      <SettingsSection title="About">
        <SettingsRow icon="information-circle-outline" label="App version" showChevron={false} value={APP_VERSION} />
        <SettingsRow
          icon="document-text-outline"
          label="Privacy policy"
          onPress={() => {
            void openUrl(LEGAL_LINKS.privacyPolicy);
          }}
        />
        <SettingsRow
          icon="document-outline"
          label="Terms of service"
          onPress={() => {
            void openUrl(LEGAL_LINKS.termsOfService);
          }}
        />
        <SettingsRow
          icon="mail-outline"
          label="Support"
          onPress={() => {
            void openUrl(LEGAL_LINKS.support);
          }}
          value="Email us"
        />
      </SettingsSection>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  profileBlock: {
    gap: spacing.lg,
    padding: spacing.md,
  },
  avatarButton: {
    alignSelf: 'center',
    width: 88,
    height: 88,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: colors.accentLime,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  avatarInitials: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nameField: {
    gap: spacing.sm,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  saveButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentLime,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 108,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonLabel: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
  helper: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  bottomSpacer: {
    height: spacing.lg,
  },
});
