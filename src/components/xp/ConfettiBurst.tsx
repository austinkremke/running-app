import { useEffect, useMemo, useRef, useState } from 'react';
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
const FALL_DISTANCE = 360;

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
    id: index,
    left: Math.random() * 100,
    delay: Math.random() * 320,
    duration: 1800 + Math.random() * 1400,
    size: 4 + Math.random() * 5,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    drift: -40 + Math.random() * 80,
    rotation: Math.random() * 360,
  }));
}

function getBurstDuration(particles: Particle[]): number {
  return Math.max(...particles.map((particle) => particle.delay + particle.duration));
}

export function ConfettiBurst({ active }: ConfettiBurstProps) {
  const particles = useMemo(() => createParticles(), []);
  const progress = useRef(particles.map(() => new Animated.Value(0))).current;
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    setVisible(true);
    progress.forEach((value) => value.stopAnimation());
    progress.forEach((value) => value.setValue(0));

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

    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, getBurstDuration(particles) + 120);

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [active, particles, progress]);

  useEffect(
    () => () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    },
    [],
  );

  if (!visible) {
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
                  inputRange: [0, 0.08, 0.9, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateY: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-24, FALL_DISTANCE],
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
    overflow: 'visible',
    zIndex: 2,
  },
  particle: {
    position: 'absolute',
    top: 0,
    borderRadius: 1,
  },
});
