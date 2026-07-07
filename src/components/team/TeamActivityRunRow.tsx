import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Run } from '../../mock';
import { colors, spacing } from '../../theme';

type TeamActivityRunRowProps = {
  run: Run;
  onPress?: () => void;
  showDivider?: boolean;
};

const AVATAR_SIZE = 36;

export function TeamActivityRunRow({ run, onPress, showDivider = true }: TeamActivityRunRowProps) {
  return (
    <View>
      <Pressable
        accessibilityLabel={`${run.user.name}'s run: ${run.title}`}
        accessibilityRole="button"
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && onPress ? styles.pressed : null]}
      >
        {run.user.avatarUrl ? (
          <Image source={{ uri: run.user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]} />
        )}

        <View style={styles.meta}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.name}>
              {run.user.name}
            </Text>
            {run.matchId ? (
              <View accessibilityLabel="Counted toward a match" style={styles.matchDot}>
                <Ionicons color={colors.accentLime} name="trophy" size={10} />
              </View>
            ) : null}
          </View>
          <Text numberOfLines={1} style={styles.stats}>
            {run.stats.distanceMiles.toFixed(2)} mi · {run.stats.duration}
            {run.stats.durationUnit ?? ''} · {run.stats.pacePerMile}/mi
          </Text>
        </View>

        <Text style={styles.timeAgo}>{run.postedAt}</Text>
      </Pressable>

      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.75,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceElevated,
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  matchDot: {
    flexShrink: 0,
  },
  stats: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  timeAgo: {
    flexShrink: 0,
    color: colors.textSecondary,
    fontSize: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
