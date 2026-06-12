import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors } from '../../theme';

type ConfettiBurstProps = {
  active: boolean;
};

type Particle = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  drift: number;
  rotation: number;
};

const CONFETTI_COLORS = [
  colors.accentLime,
  colors.accentGold,
  colors.accentPurple,
  '#FFFFFF',
];

const PARTICLE_COUNT = 28;

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
    id: index,
    left: Math.random() * 100,
    delay: Math.random() * 180,
    duration: 900 + Math.random() * 700,
    size: 4 + Math.random() * 5,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    drift: -30 + Math.random() * 60,
    rotation: Math.random() * 360,
  }));
}

export function ConfettiBurst({ active }: ConfettiBurstProps) {
  const particles = useMemo(() => createParticles(), []);
  const progress = useRef(particles.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!active) {
      progress.forEach((value) => value.setValue(0));
      return;
    }

    const animations = progress.map((value, index) =>
      Animated.sequence([
        Animated.delay(particles[index].delay),
        Animated.timing(value, {
          toValue: 1,
          duration: particles[index].duration,
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.parallel(animations).start();
  }, [active, particles, progress]);

  if (!active) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.container}>
      {particles.map((particle, index) => {
        const animatedValue = progress[index];

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: `${particle.left}%`,
                width: particle.size,
                height: particle.size * 0.6,
                backgroundColor: particle.color,
                opacity: animatedValue.interpolate({
                  inputRange: [0, 0.15, 0.85, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateY: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 180],
                    }),
                  },
                  {
                    translateX: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, particle.drift],
                    }),
                  },
                  {
                    rotate: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [`${particle.rotation}deg`, `${particle.rotation + 240}deg`],
                    }),
                  },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    top: 0,
    borderRadius: 1,
  },
});
