import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

import { TUTORIAL_RANK_LEADERBOARD } from '../../../config/onboardingTutorialData';
import { colors, spacing } from '../../../theme';

const ROW_HEIGHT = 56;
const AVATAR_SIZE = 36;

const OTHERS = TUTORIAL_RANK_LEADERBOARD.filter((entry) => !entry.isYou);
const YOU = TUTORIAL_RANK_LEADERBOARD.find((entry) => entry.isYou)!;

// Static rank order once "You" has climbed to #1 — everyone else keeps their row.
const FINAL_ORDER = [YOU, ...OTHERS];

type LeaderboardRowProps = {
  rank: number;
  name: string;
  power: number;
  level: number;
  avatarUrl: string;
  isYou?: boolean;
  showDivider?: boolean;
};

function LeaderboardRow({ rank, name, power, level, avatarUrl, isYou, showDivider }: LeaderboardRowProps) {
  return (
    <View style={[styles.row, showDivider ? styles.rowDivider : null, isYou ? styles.rowYou : null]}>
      <Text style={[styles.rank, isYou ? styles.rankYou : null]}>{rank}</Text>
      <Image source={{ uri: avatarUrl }} style={[styles.avatar, isYou ? styles.avatarYou : null]} />
      <View style={styles.identity}>
        <Text style={[styles.name, isYou ? styles.nameYou : null]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.level}>Level {level}</Text>
      </View>
      <Text style={[styles.power, isYou ? styles.powerYou : null]}>{power.toLocaleString('en-US')}</Text>
    </View>
  );
}

type RankLeaderboardClimbProps = {
  /** Animated 0→1 driver — 0 keeps "You" at the bottom, 1 finishes the climb to #1. */
  progress: Animated.Value;
};

export function RankLeaderboardClimb({ progress }: RankLeaderboardClimbProps) {
  const startY = OTHERS.length * ROW_HEIGHT;
  const youTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [startY, 0],
  });
  const youHighlight = progress.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View style={styles.card}>
      <View style={[styles.list, { height: (OTHERS.length + 1) * ROW_HEIGHT }]}>
        {OTHERS.map((entry, index) => (
          <View key={entry.id} style={[styles.staticRow, { top: (index + 1) * ROW_HEIGHT }]}>
            <LeaderboardRow
              avatarUrl={entry.avatarUrl}
              level={entry.level}
              name={entry.name}
              power={entry.power}
              rank={FINAL_ORDER.findIndex((item) => item.id === entry.id) + 1}
              showDivider={index < OTHERS.length - 1}
            />
          </View>
        ))}

        <Animated.View style={[styles.staticRow, { transform: [{ translateY: youTranslateY }] }]}>
          <Animated.View
            style={[
              styles.youGlow,
              {
                opacity: youHighlight,
              },
            ]}
          />
          <LeaderboardRow avatarUrl={YOU.avatarUrl} isYou level={YOU.level} name={YOU.name} power={YOU.power} rank={1} />
        </Animated.View>
      </View>
    </View>
  );
}

type RankLeaderboardClimbStaticExports = {
  ROW_HEIGHT: number;
  ROW_COUNT: number;
};

export const RankLeaderboardClimbLayout: RankLeaderboardClimbStaticExports = {
  ROW_HEIGHT,
  ROW_COUNT: OTHERS.length + 1,
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  list: {
    width: '100%',
  },
  staticRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ROW_HEIGHT,
  },
  youGlow: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: -spacing.md,
    right: -spacing.md,
    backgroundColor: 'rgba(215, 255, 47, 0.08)',
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_HEIGHT,
    gap: spacing.sm,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowYou: {
    borderRadius: 10,
  },
  rank: {
    width: 18,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  rankYou: {
    color: colors.accentLime,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarYou: {
    borderColor: colors.accentLime,
    borderWidth: 2,
  },
  identity: {
    flex: 1,
    gap: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  nameYou: {
    color: colors.accentLime,
  },
  level: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  power: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  powerYou: {
    color: colors.accentLime,
  },
});
