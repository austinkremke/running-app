import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import type { AchievementVariant } from '../../mock';
import { colors } from '../../theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type HexBadgeProps = {
  size?: number;
  variant?: AchievementVariant | 'outline';
  icon?: IoniconsName;
  iconSize?: number;
  badgeText?: string;
  /** Stroke-only hex with variant-colored border. Used for achievement badges. */
  stroked?: boolean;
  children?: ReactNode;
};

const VARIANT_COLORS: Record<AchievementVariant | 'outline', { fill: string; stroke: string }> = {
  purple: { fill: colors.accentPurple, stroke: colors.accentPurple },
  lime: { fill: colors.accentLime, stroke: colors.accentLime },
  gold: { fill: colors.accentGold, stroke: colors.accentGold },
  outline: { fill: colors.surface, stroke: colors.accentLime },
};

function getHexagonPoints(width: number, height: number, inset = 0): string {
  const cx = width / 2;
  const cy = height / 2;
  const rx = width / 2 - inset;
  const ry = height / 2 - inset;

  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');
}

export function HexBadge({
  size = 56,
  variant = 'purple',
  icon,
  iconSize = 22,
  badgeText,
  stroked = false,
  children,
}: HexBadgeProps) {
  const height = size * 0.86;
  const isOutlineVariant = variant === 'outline';
  const palette = VARIANT_COLORS[isOutlineVariant ? 'outline' : variant];
  const isStroked = stroked || isOutlineVariant;
  const strokeColor =
    isStroked && !isOutlineVariant
      ? VARIANT_COLORS[variant].stroke
      : palette.stroke;
  const isLightFill = !isStroked && (variant === 'lime' || variant === 'gold');
  const iconColor = isStroked
    ? strokeColor
    : isLightFill
      ? colors.background
      : colors.textPrimary;
  const textColor = isStroked ? strokeColor : iconColor;
  const hasGlow = variant === 'outline' && !stroked;
  const glowPad = hasGlow ? 4 : 0;
  const canvasWidth = size + glowPad * 2;
  const canvasHeight = height + glowPad * 2;

  return (
    <View
      style={[
        styles.wrapper,
        hasGlow && styles.glowWrapper,
        { width: canvasWidth, height: canvasHeight },
      ]}
    >
      <Svg
        height={canvasHeight}
        style={hasGlow ? styles.glowSvg : undefined}
        viewBox={`${-glowPad} ${-glowPad} ${canvasWidth} ${canvasHeight}`}
        width={canvasWidth}
      >
        {hasGlow ? (
          <>
            <Polygon
              fill="none"
              points={getHexagonPoints(size, height, -1.5)}
              stroke={colors.accentLime}
              strokeOpacity={0.06}
              strokeWidth={6}
            />
            <Polygon
              fill="none"
              points={getHexagonPoints(size, height, -0.5)}
              stroke={colors.accentLime}
              strokeOpacity={0.12}
              strokeWidth={3}
            />
          </>
        ) : null}
        <Polygon
          fill={isStroked ? colors.surface : palette.fill}
          points={getHexagonPoints(size, height, 1)}
          stroke={strokeColor}
          strokeWidth={isStroked ? 1.5 : 0}
        />
      </Svg>

      <View style={styles.content}>
        {children}
        {icon ? <Ionicons color={iconColor} name={icon} size={iconSize} /> : null}
        {badgeText ? (
          <Text style={[styles.badgeText, { color: textColor }, icon && styles.badgeTextOffset]}>
            {badgeText}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWrapper: {
    shadowColor: colors.accentLime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 2,
  },
  glowSvg: {
    position: 'absolute',
  },
  content: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  badgeTextOffset: {
    marginTop: -2,
  },
});
