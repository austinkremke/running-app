import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';

type ShimmerTextProps = {
  text: string;
  fontSize: number;
  color: string;
  fontWeight?: string;
  italic?: boolean;
  letterSpacing?: number;
  uppercase?: boolean;
};

/** Real text (always visible) with a soft sweeping highlight, tightly boxed to
 * the measured text size so it reads as a shimmer on the letters, not a
 * floating rectangle. */
export function ShimmerText({
  text,
  fontSize,
  color,
  fontWeight = '800',
  italic = true,
  letterSpacing = 0,
  uppercase = true,
}: ShimmerTextProps) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const translateX = useRef(new Animated.Value(0)).current;
  const displayText = uppercase ? text.toUpperCase() : text;

  useEffect(() => {
    setSize(null);
  }, [displayText, fontSize, fontWeight, italic, letterSpacing]);

  useEffect(() => {
    if (!size) return;
    const sweepWidth = size.width * 0.6;
    translateX.setValue(-sweepWidth);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, { toValue: size.width, duration: 1100, useNativeDriver: true }),
        Animated.delay(900),
        Animated.timing(translateX, { toValue: -sweepWidth, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [size, translateX]);

  const textStyle = {
    fontSize,
    fontWeight: fontWeight as never,
    fontStyle: italic ? ('italic' as const) : ('normal' as const),
    letterSpacing,
    color,
  };

  return (
    <View
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (!size) setSize({ width, height });
      }}
      style={{ overflow: 'hidden' }}
    >
      <Text style={textStyle}>{displayText}</Text>
      {size ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: size.width * 0.6,
            transform: [{ translateX }],
          }}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.55)', 'transparent']}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}
