import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { TUTORIAL_OPPONENT, TUTORIAL_USER } from '../../../config/onboardingTutorialData';
import { Avatar } from '../../avatar';
import { colors, spacing } from '../../../theme';
import { MatchVsIndicator } from '../../match/MatchVsIndicator';
import { AnimatedDualRouteMap } from './AnimatedDualRouteMap';

export function MatchupHookVisual() {
  const [routeDone, setRouteDone] = useState(false);
  const homeSlide = useRef(new Animated.Value(-60)).current;
  const awaySlide = useRef(new Animated.Value(60)).current;
  const avatarsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!routeDone) return;

    Animated.parallel([
      Animated.timing(avatarsOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(homeSlide, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 8 }),
      Animated.spring(awaySlide, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 8 }),
    ]).start();
  }, [routeDone, avatarsOpacity, homeSlide, awaySlide]);

  return (
    <View style={styles.container}>
      <AnimatedDualRouteMap onDone={() => setRouteDone(true)} />

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
            showLevel
            level={15}
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
            showLevel
            level={14}
            size={72}
          />
          <Text style={[styles.name, { color: colors.accentPurple }]}>{TUTORIAL_OPPONENT.name}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
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
