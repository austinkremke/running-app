import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SoloRatingHistoryEntry } from '../../services/rank';
import { RankBorderAvatar } from '../team/RankBorderAvatar';
import { colors, spacing } from '../../theme';

const RESULT_LABEL: Record<SoloRatingHistoryEntry['result'], string> = {
  win: 'WIN',
  loss: 'LOSS',
  tie: 'TIE',
};

const RESULT_COLOR: Record<SoloRatingHistoryEntry['result'], string> = {
  win: colors.accentLime,
  loss: colors.textSecondary,
  tie: colors.textSecondary,
};

const AVATAR_SIZE = 26;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatSignedDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

type MatchHistoryRowProps = {
  entry: SoloRatingHistoryEntry;
  viewerAvatarUrl?: string;
  viewerRankTierId?: string;
  onPress?: () => void;
};

export function MatchHistoryRow({ entry, viewerAvatarUrl, viewerRankTierId, onPress }: MatchHistoryRowProps) {
  return (
    <Pressable
      accessibilityHint="Opens this match's details"
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && onPress ? styles.pressed : null]}
    >
      <View style={styles.avatarPair}>
        <RankBorderAvatar avatarUrl={viewerAvatarUrl} rankTierId={viewerRankTierId} size={AVATAR_SIZE} />
        <RankBorderAvatar
          avatarUrl={entry.opponentAvatarUrl ?? undefined}
          rankTierId={entry.opponentRankTierId}
          size={AVATAR_SIZE}
        />
      </View>

      <View style={styles.body}>
        <Text style={styles.opponent}>vs {entry.opponentName}</Text>
        <Text style={styles.date}>{formatDate(entry.endedAt)}</Text>
      </View>

      <View style={[styles.resultBadge, { borderColor: RESULT_COLOR[entry.result] }]}>
        <Text style={[styles.resultText, { color: RESULT_COLOR[entry.result] }]}>
          {RESULT_LABEL[entry.result]}
        </Text>
      </View>
      <Text
        style={[
          styles.delta,
          entry.ratingDelta > 0 ? styles.deltaPositive : styles.deltaNegative,
        ]}
      >
        {formatSignedDelta(entry.ratingDelta)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  avatarPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  resultText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  body: {
    flex: 1,
    gap: 1,
  },
  opponent: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  date: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  delta: {
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    minWidth: 34,
    textAlign: 'right',
  },
  deltaPositive: {
    color: colors.accentLime,
  },
  deltaNegative: {
    color: colors.textSecondary,
  },
});
