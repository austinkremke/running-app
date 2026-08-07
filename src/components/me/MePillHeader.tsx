import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme';

export type MePillMode = 'progress' | 'competitive';

const PILLS: { key: MePillMode; label: string }[] = [
  { key: 'progress', label: 'PROGRESS' },
  { key: 'competitive', label: 'COMPETITIVE' },
];

type MePillHeaderProps = {
  activeMode: MePillMode;
  onModeChange: (mode: MePillMode) => void;
  onOpenSettings?: () => void;
};

/**
 * Replaces the old "ME" title + settings-cog `AppHeader` for this screen — this
 * bar hosts the Progress/Competitive switcher plus the settings cog (moved back
 * here from `ProfileHeaderCentered`'s top-right slot), while still owning the
 * top safe-area inset (removing `AppHeader` entirely left content rendered
 * under the status bar/notch, since nothing else in the Me tab pads for it).
 */
export function MePillHeader({ activeMode, onModeChange, onOpenSettings }: MePillHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={styles.side} />

        <View style={styles.pills}>
          {PILLS.map((pill) => {
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
          })}
        </View>

        <View style={[styles.side, styles.sideRight]}>
          {onOpenSettings ? (
            <Pressable
              accessibilityLabel="Settings"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onOpenSettings}
              style={styles.settingsButton}
            >
              <Ionicons color={colors.textPrimary} name="settings-outline" size={22} />
            </Pressable>
          ) : null}
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
