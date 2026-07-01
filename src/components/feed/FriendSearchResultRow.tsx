import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FriendSearchResult } from '../../services/friendService';
import { colors, spacing } from '../../theme';
import { RankBorderAvatar } from '../team/RankBorderAvatar';
import { rankTierColorForTier } from '../team/rankAvatarBorderTheme';
import { RunCardAddFriendButton } from './RunCardAddFriendButton';

type FriendSearchResultRowProps = {
  result: FriendSearchResult;
  isFriend: boolean;
  adding?: boolean;
  onAddFriend?: () => void;
  showDivider?: boolean;
};

const AVATAR_FRAME_SIZE = 44;

export function FriendSearchResultRow({
  result,
  isFriend,
  adding = false,
  onAddFriend,
  showDivider = true,
}: FriendSearchResultRowProps) {
  return (
    <View>
      <View style={styles.row}>
        <RankBorderAvatar
          avatarUrl={result.avatarUrl}
          rankTierId={result.rankTierId}
          size={AVATAR_FRAME_SIZE}
        />

        <View style={styles.meta}>
          <Text numberOfLines={1} style={styles.name}>
            {result.displayName}
          </Text>
          {result.rankTitle ? (
            <Text
              numberOfLines={1}
              style={[styles.rankTitle, { color: rankTierColorForTier(result.rankTierId) }]}
            >
              {result.rankTitle}
              {result.competitiveRating != null
                ? ` · ${result.competitiveRating.toLocaleString()} PR`
                : ''}
            </Text>
          ) : null}
          <Text numberOfLines={1} style={styles.subline}>
            Level {result.level} · {result.teamName}
          </Text>
        </View>

        {isFriend ? (
          <Text style={styles.friendsLabel}>Friends</Text>
        ) : onAddFriend ? (
          <RunCardAddFriendButton disabled={adding} onPress={onAddFriend} />
        ) : null}
      </View>

      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  rankTitle: {
    fontSize: 10,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  subline: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  friendsLabel: {
    color: colors.accentLime,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md + AVATAR_FRAME_SIZE + spacing.sm,
  },
});
