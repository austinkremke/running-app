import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme';
import { FLAG_COMPONENTS } from './flagRegistry.generated';

type FlagIconProps = {
  /** ISO-3166-1 alpha-2 region code, e.g. "US". Unrecognized/missing codes render nothing. */
  regionCode?: string | null;
  width: number;
  /** Defaults to a 3:2 aspect ratio (the source SVGs' native ratio). */
  height?: number;
  borderRadius?: number;
};

/**
 * Real rectangular flag artwork (`country-flag-icons`, bundled as SVG via
 * `react-native-svg-transformer`) instead of the platform emoji glyph — Apple's
 * emoji flags render with a glossy/wavy look and can't take a border-radius or
 * be recolored, so they didn't match this screen's flat card aesthetic.
 */
export function FlagIcon({ regionCode, width, height, borderRadius = 3 }: FlagIconProps) {
  const Flag = regionCode ? FLAG_COMPONENTS[regionCode.toUpperCase()] : undefined;
  if (!Flag) return null;

  const resolvedHeight = height ?? Math.round((width * 2) / 3);

  return (
    <View
      style={[
        styles.clip,
        { width, height: resolvedHeight, borderRadius },
      ]}
    >
      <Flag height={resolvedHeight} width={width} />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: colors.surfaceElevated,
  },
});
