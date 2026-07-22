import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, G, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

let instanceCounter = 0;

type ShimmerTextProps = {
  text: string;
  fontSize: number;
  color: string;
  fontWeight?: string;
  italic?: boolean;
  letterSpacing?: number;
  uppercase?: boolean;
};

/** Renders text with a light-sweep shimmer clipped to the glyph shapes (not a floating overlay). */
export function ShimmerText({
  text,
  fontSize,
  color,
  fontWeight = '800',
  italic = true,
  letterSpacing = 0,
  uppercase = true,
}: ShimmerTextProps) {
  const [instanceId] = useState(() => `shimmer-${++instanceCounter}`);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const translateX = useRef(new Animated.Value(0)).current;
  const displayText = uppercase ? text.toUpperCase() : text;
  const fontStyle = italic ? ('italic' as const) : ('normal' as const);

  useEffect(() => {
    // Reset so a text change (e.g. rank tier changing) re-measures before animating again.
    setSize(null);
  }, [displayText, fontSize, fontWeight, italic, letterSpacing]);

  useEffect(() => {
    if (!size) return;

    const sweepWidth = size.width * 0.35;
    translateX.setValue(-sweepWidth);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: size.width,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.delay(1300),
        Animated.timing(translateX, { toValue: -sweepWidth, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [size, translateX]);

  if (!size) {
    return (
      <Text
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setSize({ width: Math.ceil(width) + 2, height: Math.ceil(height) });
        }}
        style={{ fontSize, fontWeight: fontWeight as never, fontStyle, letterSpacing, color, opacity: 0 }}
      >
        {displayText}
      </Text>
    );
  }

  const clipId = `${instanceId}-clip`;
  const gradientId = `${instanceId}-gradient`;
  const sweepWidth = size.width * 0.35;
  const baselineY = size.height * 0.8;

  return (
    <View style={{ width: size.width, height: size.height }}>
      <Svg height={size.height} width={size.width}>
        <Defs>
          <ClipPath id={clipId}>
            <SvgText
              fill={color}
              fontSize={fontSize}
              fontStyle={fontStyle}
              fontWeight={fontWeight}
              letterSpacing={letterSpacing}
              x={0}
              y={baselineY}
            >
              {displayText}
            </SvgText>
          </ClipPath>
          <LinearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
            <Stop offset="0" stopColor="#ffffff" stopOpacity={0} />
            <Stop offset="0.5" stopColor="#ffffff" stopOpacity={0.9} />
            <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        <SvgText
          fill={color}
          fontSize={fontSize}
          fontStyle={fontStyle}
          fontWeight={fontWeight}
          letterSpacing={letterSpacing}
          x={0}
          y={baselineY}
        >
          {displayText}
        </SvgText>

        <G clipPath={`url(#${clipId})`}>
          <AnimatedRect
            fill={`url(#${gradientId})`}
            height={size.height}
            width={sweepWidth}
            x={translateX}
            y={0}
          />
        </G>
      </Svg>
    </View>
  );
}
