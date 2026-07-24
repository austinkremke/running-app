import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TopPlayerListing } from '../../mock';
import { colors, spacing } from '../../theme';
import { RankBorderAvatar } from '../team/RankBorderAvatar';

type PlayerLeaderboardCardProps = {
  player: TopPlayerListing;
  onPress?: () => void;
};

function formatRating(value: number): string {
  return value.toLocaleString('en-US');
}

export function PlayerLeaderboardCard({ player, onPress }: PlayerLeaderboardCardProps) {
  const isTopRank = player.rank === 1;

  return (
    <Pressable
      accessibilityHint="Opens this runner's profile"
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.pressed : null]}
    >
      <View style={styles.cardBody}>
        <View style={styles.leading}>
          <Text
            numberOfLines={1}
            style={[styles.rank, isTopRank ? styles.rankTop : styles.rankDefault]}
          >
            {player.rank}
          </Text>
          <RankBorderAvatar avatarUrl={player.avatarUrl} rankTierId={player.rankTierId} size={52} />
        </View>

        <View style={styles.identity}>
          <Text numberOfLines={1} style={styles.name}>
            {player.name}
          </Text>
          <Text style={styles.record}>
            {player.wins}-{player.losses} record
          </Text>
        </View>

        <View style={styles.trailing}>
          <Text style={styles.ratingValue}>{formatRating(player.rating)}</Text>
          <Text style={styles.ratingLabel}>Power Rating</Text>
        </View>
      </View>
    </Pressable>
  );
}

const LEADING_INSET = spacing.md;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingRight: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LEADING_INSET,
    paddingLeft: LEADING_INSET,
    flexShrink: 0,
  },
  rank: {
    minWidth: 24,
    flexShrink: 0,
    fontSize: 26,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 28,
    textAlign: 'center',
  },
  rankTop: {
    color: colors.accentLime,
  },
  rankDefault: {
    color: colors.textPrimary,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    justifyContent: 'center',
  },
  name: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
  record: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  trailing: {
    flexShrink: 0,
    alignItems: 'flex-end',
    minWidth: 72,
  },
  ratingValue: {
    color: colors.accentLime,
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  ratingLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 1,
  },
});
