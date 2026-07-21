import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { RunUser } from '../../mock';
import { colors, spacing } from '../../theme';
import { RankBorderAvatar } from '../team/RankBorderAvatar';
import { rankBorderSourceForTier } from '../team/rankAvatarBorderTheme';
import { RunCardAddFriendButton } from './RunCardAddFriendButton';
import { UserLevelBadge } from './UserLevelBadge';

type RunCardHeaderProps = {
  user: RunUser;
  postedAt: string;
  location: string;
  showAddFriend?: boolean;
  addFriendDisabled?: boolean;
  addFriendPending?: boolean;
  onAddFriend?: () => void;
  /** Opens the runner's profile — tapping the avatar/name, separate from the card body's run-detail tap target. */
  onOpenProfile?: () => void;
};

const AVATAR_SIZE = 40;
const RANK_BORDER_FRAME_SIZE = 48;

export function RunCardHeader({
  user,
  postedAt,
  location,
  showAddFriend = false,
  addFriendDisabled = false,
  addFriendPending = false,
  onAddFriend,
  onOpenProfile,
}: RunCardHeaderProps) {
  const hasRankBorder = rankBorderSourceForTier(user.rankTierId) != null;
  const frameSize = hasRankBorder ? RANK_BORDER_FRAME_SIZE : AVATAR_SIZE;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityHint="Opens this runner's profile"
        accessibilityRole="button"
        disabled={!onOpenProfile}
        onPress={onOpenProfile}
        style={styles.identity}
      >
        <View style={[styles.avatarWrap, { width: frameSize + 4 }]}>
          {hasRankBorder ? (
            <RankBorderAvatar
              avatarUrl={user.avatarUrl}
              rankTierId={user.rankTierId}
              size={frameSize}
            />
          ) : (
            <View
              style={[
                styles.avatarPlain,
                { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
              ]}
            >
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]} />
              )}
            </View>
          )}
          <UserLevelBadge level={user.level} />
        </View>

        <View style={styles.meta}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.subline}>
            {postedAt} • {location}
          </Text>
          <View style={styles.teamRow}>
            <Text style={styles.teamName}>{user.teamName}</Text>
          </View>
        </View>
      </Pressable>

      {showAddFriend && onAddFriend ? (
        <RunCardAddFriendButton
          disabled={addFriendDisabled}
          onPress={onAddFriend}
          pending={addFriendPending}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  avatarWrap: {
    alignItems: 'center',
    paddingBottom: 4,
    overflow: 'visible',
  },
  avatarPlain: {
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
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
});
