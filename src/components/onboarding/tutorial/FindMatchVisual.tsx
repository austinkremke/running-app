import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';

import { TUTORIAL_OPPONENT, TUTORIAL_USER } from '../../../config/onboardingTutorialData';
import { Avatar } from '../../avatar';
import { colors, spacing } from '../../../theme';
import { MatchVsIndicator } from '../../match/MatchVsIndicator';

const SEARCH_DURATION_MS = 1000;

export function FindMatchVisual() {
  const [matched, setMatched] = useState(false);
  const loadingOpacity = useRef(new Animated.Value(1)).current;
  const homeSlide = useRef(new Animated.Value(-70)).current;
  const awaySlide = useRef(new Animated.Value(70)).current;
  const avatarsOpacity = useRef(new Animated.Value(0)).current;
  const formatOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(loadingOpacity, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start(() => setMatched(true));
    }, SEARCH_DURATION_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!matched) return;

    Animated.parallel([
      Animated.timing(avatarsOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(homeSlide, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 8 }),
      Animated.spring(awaySlide, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 8 }),
    ]).start(() => {
      Animated.timing(formatOpacity, {
        toValue: 1,
        duration: 320,
        delay: 150,
        useNativeDriver: true,
      }).start();
    });
  }, [matched, avatarsOpacity, homeSlide, awaySlide, formatOpacity]);

  return (
    <View style={styles.container}>
      {!matched ? (
        <Animated.View style={[styles.loadingCard, { opacity: loadingOpacity }]}>
          <ActivityIndicator color={colors.accentLime} size="small" />
          <Text style={styles.loadingLabel}>Searching for Match…</Text>
        </Animated.View>
      ) : (
        <View style={styles.matchedBlock}>
          <Animated.View style={[styles.formatBlock, { opacity: formatOpacity }]}>
            <Text style={styles.formatLabel}>3 Day Run Off</Text>
            <Text style={styles.formatSubtitle}>Highest Score Wins</Text>
          </Animated.View>

          <View style={styles.matchupRow}>
            <Animated.View
              style={[
                styles.side,
                { opacity: avatarsOpacity, transform: [{ translateX: homeSlide }] },
              ]}
            >
              <Avatar
                avatarUrl={TUTORIAL_USER.avatarUrl}
                borderColor={colors.accentLime}
                borderWidth={2}
                size={72}
              />
              <Text style={[styles.name, { color: colors.accentLime }]}>{TUTORIAL_USER.name}</Text>
            </Animated.View>

            <MatchVsIndicator variant="diamond" />

            <Animated.View
              style={[
                styles.side,
                { opacity: avatarsOpacity, transform: [{ translateX: awaySlide }] },
              ]}
            >
              <Avatar
                avatarUrl={TUTORIAL_OPPONENT.avatarUrl}
                borderColor={colors.accentPurple}
                borderWidth={2}
                size={72}
              />
              <Text style={[styles.name, { color: colors.accentPurple }]}>
                {TUTORIAL_OPPONENT.name}
              </Text>
            </Animated.View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  loadingLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  matchedBlock: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  formatBlock: {
    alignItems: 'center',
    gap: 2,
  },
  formatLabel: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  formatSubtitle: {
    color: colors.accentLime,
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  side: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
  },
});
