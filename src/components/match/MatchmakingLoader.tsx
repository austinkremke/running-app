import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors } from '../../theme';

const LOADER_SIZE = 44;
const RING_SIZE = LOADER_SIZE - 4;

export function MatchmakingLoader() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      }),
    );

    animation.start();
    return () => animation.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.ring,
          {
            transform: [{ rotate }],
          },
        ]}
      />
      <Ionicons color={colors.accentLime} name="footsteps" size={18} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: LOADER_SIZE,
    height: LOADER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: LOADER_SIZE / 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: colors.accentLime,
    borderRightColor: 'rgba(215, 255, 47, 0.35)',
  },
});
