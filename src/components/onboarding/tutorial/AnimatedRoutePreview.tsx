import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Comfortably longer than any path we draw here, so the dash trick works without measuring. */
const DASH_LENGTH = 700;

type AnimatedRoutePreviewProps = {
  path: string;
  color: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  duration?: number;
  delay?: number;
  /** Pulse a dot at the route's end once drawing finishes. */
  endpoint?: { x: number; y: number };
  onDone?: () => void;
};

export function AnimatedRoutePreview({
  path,
  color,
  width = 320,
  height = 140,
  strokeWidth = 4,
  duration = 900,
  delay = 0,
  endpoint,
  onDone,
}: AnimatedRoutePreviewProps) {
  const dashOffset = useRef(new Animated.Value(DASH_LENGTH)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dashOffset.setValue(DASH_LENGTH);
    pulse.setValue(0);

    // SVG shape attributes (strokeDashoffset, r, opacity here) aren't backed by the
    // native View layer, so these run on the JS thread rather than useNativeDriver.
    Animated.timing(dashOffset, {
      toValue: 0,
      duration,
      delay,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return;
      onDone?.();

      if (endpoint) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: false }),
            Animated.timing(pulse, { toValue: 0, duration: 500, useNativeDriver: false }),
          ]),
          { iterations: 2 },
        ).start();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const pulseRadius = pulse.interpolate({ inputRange: [0, 1], outputRange: [5, 16] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <Svg height={height} viewBox={`0 0 ${width} ${height}`} width="100%">
      <AnimatedPath
        d={path}
        fill="none"
        stroke={color}
        strokeDasharray={[DASH_LENGTH, DASH_LENGTH]}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      {endpoint ? (
        <>
          <AnimatedCircle
            cx={endpoint.x}
            cy={endpoint.y}
            fill={color}
            opacity={pulseOpacity}
            r={pulseRadius}
          />
          <Circle cx={endpoint.x} cy={endpoint.y} fill={color} r={5} />
        </>
      ) : null}
    </Svg>
  );
}
