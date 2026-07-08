import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../../avatar';
import { colors, spacing } from '../../../theme';
import { MatchVsIndicator } from '../../match/MatchVsIndicator';
import { AnimatedRoutePreview } from './AnimatedRoutePreview';

const ROUTE_PATH = 'M20,100 C 80,20 140,120 200,40 S 280,90 300,20';

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
      <AnimatedRoutePreview
        color={colors.accentLime}
        endpoint={{ x: 300, y: 20 }}
        onDone={() => setRouteDone(true)}
        path={ROUTE_PATH}
      />

      <View style={styles.matchupRow}>
        <Animated.View
          style={[
            styles.side,
            { opacity: avatarsOpacity, transform: [{ translateX: homeSlide }] },
          ]}
        >
          <Avatar showLevel level={15} size={72} />
          <Text style={styles.name}>You</Text>
        </Animated.View>

        <MatchVsIndicator variant="diamond" />

        <Animated.View
          style={[
            styles.side,
            { opacity: avatarsOpacity, transform: [{ translateX: awaySlide }] },
          ]}
        >
          <Avatar showLevel level={14} size={72} />
          <Text style={styles.name}>Opponent</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xxl,
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
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
  },
});
