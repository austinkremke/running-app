import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme';

export type MePillMode = 'progress' | 'competitive';

const PILLS: { key: MePillMode; label: string }[] = [
  { key: 'progress', label: 'PROGRESS' },
  { key: 'competitive', label: 'COMPETITIVE' },
];

type MePillHeaderProps = {
  /** Required when `showPills` (the default) is true; unused otherwise. */
  activeMode?: MePillMode;
  onModeChange?: (mode: MePillMode) => void;
  onOpenSettings?: () => void;
  /** Back chevron shown on the left instead of a spacer — used when viewing another user's profile. */
  onBack?: () => void;
  /** Progress/Competitive switcher is exclusive to the signed-in viewer's own profile. */
  showPills?: boolean;
  /** Overrides the settings cog on the right — used for a friend-menu button on another user's profile. */
  rightAccessory?: ReactNode;
};

/**
 * Shared top bar for both the owner's own Me tab and the read-only other-user
 * profile view (`UserProfileScreen` renders `MeScreen` with `viewedUserId`) —
 * one component, two modes, so the two screens don't fork into separate
 * header implementations. Owns the top safe-area inset (removing `AppHeader`
 * entirely left content rendered under the status bar/notch, since nothing
 * else in the Me tab pads for it).
 */
export function MePillHeader({
  activeMode,
  onModeChange,
  onOpenSettings,
  onBack,
  showPills = true,
  rightAccessory,
}: MePillHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={styles.side}>
          {onBack ? (
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onBack}
              style={styles.settingsButton}
            >
              <Ionicons color={colors.textPrimary} name="chevron-back" size={24} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.pills}>
          {showPills && activeMode && onModeChange
            ? PILLS.map((pill) => {
                const isActive = pill.key === activeMode;
                return (
                  <Pressable
                    key={pill.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    onPress={() => onModeChange(pill.key)}
                    style={[styles.pill, isActive && styles.pillActive]}
                  >
                    <Text style={[styles.pillLabel, isActive && styles.pillLabelActive]}>{pill.label}</Text>
                  </Pressable>
                );
              })
            : null}
        </View>

        <View style={[styles.side, styles.sideRight]}>
          {rightAccessory ??
            (onOpenSettings ? (
              <Pressable
                accessibilityLabel="Settings"
                accessibilityRole="button"
                hitSlop={8}
                onPress={onOpenSettings}
                style={styles.settingsButton}
              >
                <Ionicons color={colors.textPrimary} name="settings-outline" size={22} />
              </Pressable>
            ) : null)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  side: {
    width: 32,
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  settingsButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pills: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  pillActive: {
    borderColor: colors.accentLime,
    backgroundColor: colors.accentLime,
  },
  pillLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  pillLabelActive: {
    color: colors.background,
  },
});
