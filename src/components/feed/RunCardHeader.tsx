import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { RunUser } from '../../mock';
import { colors, spacing } from '../../theme';
import { UserLevelBadge } from './UserLevelBadge';

type RunCardHeaderProps = {
  user: RunUser;
  postedAt: string;
  location: string;
};

const AVATAR_SIZE = 40;

export function RunCardHeader({ user, postedAt, location }: RunCardHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatarRing}>
          <View style={styles.avatarInner}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
          </View>
        </View>
        <UserLevelBadge level={user.level} />
      </View>

      <View style={styles.meta}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.subline}>
          {postedAt} • {location}
        </Text>
        <View style={styles.teamRow}>
          <Ionicons color={colors.accentLime} name="shield-outline" size={11} />
          <Text style={styles.teamName}>{user.teamName}</Text>
        </View>
      </View>

      <Pressable accessibilityLabel="More options" hitSlop={8} style={styles.menu}>
        <Ionicons color={colors.textSecondary} name="ellipsis-horizontal" size={16} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  avatarWrap: {
    width: AVATAR_SIZE + 4,
    alignItems: 'center',
    paddingBottom: 4,
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.accentLime,
    padding: 1,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceElevated,
  },
  meta: {
    flex: 1,
    paddingTop: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  subline: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  teamName: {
    color: colors.accentLime,
    fontSize: 11,
    fontWeight: '600',
  },
  menu: {
    paddingTop: 2,
  },
});
