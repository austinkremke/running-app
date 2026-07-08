import { useEffect, useRef, useState } from 'react';
import { Animated, Text, type TextStyle, type StyleProp } from 'react-native';

type AnimatedCounterProps = {
  from: number;
  to: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
};

/** Ticks a number from -> to. Animated.Value can't drive text directly, so we listen and setState. */
export function AnimatedCounter({
  from,
  to,
  duration = 700,
  delay = 0,
  prefix = '',
  suffix = '',
  style,
}: AnimatedCounterProps) {
  const value = useRef(new Animated.Value(from)).current;
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    const listenerId = value.addListener(({ value: next }) => {
      setDisplay(Math.round(next));
    });

    const animation = Animated.timing(value, {
      toValue: to,
      duration,
      delay,
      useNativeDriver: false,
    });

    animation.start();

    return () => {
      value.removeListener(listenerId);
      animation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, from, duration, delay]);

  return (
    <Text style={style}>
      {prefix}
      {display.toLocaleString('en-US')}
      {suffix}
    </Text>
  );
}
