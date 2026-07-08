import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { TUTORIAL_LEADERBOARD, TUTORIAL_TEAM } from '../../../config/onboardingTutorialData';
import { colors, spacing } from '../../../theme';
import { Avatar } from '../../avatar';
import { AnimatedCounter } from './AnimatedCounter';

const ROW_SHIFT = 56;

export function TeamLeaderboardDemo() {
  const rowShift = useRef(new Animated.Value(ROW_SHIFT)).current;
  const memberPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(500),
      Animated.spring(rowShift, { toValue: 0, useNativeDriver: true, speed: 12, bounciness: 6 }),
    ]).start();

    Animated.sequence([
      Animated.delay(200),
      Animated.timing(memberPulse, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(memberPulse, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [rowShift, memberPulse]);

  const memberGlow = memberPulse.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.accentLime] });

  return (
    <View style={styles.container}>
      <View style={styles.teamCard}>
        <View style={styles.teamHeader}>
          <Text style={styles.teamName}>{TUTORIAL_TEAM.name}</Text>
          <Text style={styles.teamRank}>Team Rank #{TUTORIAL_TEAM.rank}</Text>
        </View>

        <View style={styles.membersRow}>
          {Array.from({ length: TUTORIAL_TEAM.memberCount }).map((_, index) => (
            <Animated.View
              key={index}
              style={[styles.memberAvatar, index === 0 && { borderColor: memberGlow }]}
            >
              <Avatar size={28} />
            </Animated.View>
          ))}
        </View>

        <View style={styles.pointsBlock}>
          <Text style={styles.pointsLabel}>Weekly Points</Text>
          <AnimatedCounter
            delay={300}
            duration={900}
            from={TUTORIAL_TEAM.weeklyPointsBefore}
            style={styles.pointsValue}
            to={TUTORIAL_TEAM.weeklyPointsAfter}
          />
        </View>
      </View>

      <View style={styles.leaderboard}>
        {TUTORIAL_LEADERBOARD.map((row, index) => {
          const isTeam = row.name === TUTORIAL_TEAM.name;
          return (
            <Animated.View
              key={row.name}
              style={[
                styles.leaderboardRow,
                isTeam && styles.leaderboardRowActive,
                isTeam ? { transform: [{ translateY: rowShift }] } : null,
              ]}
            >
              <Text style={styles.leaderboardRank}>{index + 1}</Text>
              <Text style={[styles.leaderboardName, isTeam && styles.leaderboardNameActive]}>
                {row.name}
              </Text>
              <Text style={styles.leaderboardPoints}>{row.points.toLocaleString()}</Text>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  teamCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  teamHeader: {
    gap: 2,
  },
  teamName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  teamRank: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  membersRow: {
    flexDirection: 'row',
    gap: -6,
  },
  memberAvatar: {
    marginRight: -6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pointsBlock: {
    marginTop: spacing.xs,
    gap: 2,
  },
  pointsLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pointsValue: {
    color: colors.accentLime,
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  leaderboard: {
    gap: spacing.xs,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  leaderboardRowActive: {
    borderColor: colors.accentLime,
  },
  leaderboardRank: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    width: 16,
  },
  leaderboardName: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  leaderboardNameActive: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  leaderboardPoints: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
});
