import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import TopographySvg from '../../assets/topographyBackground.svg';

type TopographyBackgroundProps = {
  /** Any color — the artwork uses `currentColor` fills, so this fully recolors it. */
  color: string;
  /** Overall opacity of the artwork on top of its own two-tone path opacities — use this for a "subtle" wash. */
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Decorative topography-line artwork, stretched to fill and crop (`slice`)
 * whatever rectangle its parent gives it — used as a full-bleed wash behind
 * the entire Me tab header section, not just the avatar.
 *
 * Source: a customer-supplied Illustrator EPS
 * (`abstract_map_background_with_topography_design_1105.eps`), converted
 * offline via `gs` → PDF → `pdftocairo -svg`, then hand-processed to:
 *  - drop the flat backdrop rectangle (only the contour-line paths are kept)
 *  - collapse ~2245 individual per-shape paths (one per topo cell, exported by
 *    the PDF→SVG pipeline) into 2 merged `<path>`s — one per original gray
 *    tone — so the app isn't rendering thousands of native SVG nodes for a
 *    decorative background
 *  - replace both tones' literal grays with `fill="currentColor"` at their
 *    original relative opacity (0.9 / 0.45), so a single `color` prop tints
 *    the whole thing while keeping the two-tone contour depth
 * Regenerate `src/assets/topographyBackground.svg` from the source EPS the
 * same way if the artwork ever needs to change.
 */
export function TopographyBackground({ color, opacity = 1, style }: TopographyBackgroundProps) {
  return (
    <View pointerEvents="none" style={[styles.clip, { opacity }, style]}>
      <TopographySvg color={color} height="100%" preserveAspectRatio="xMidYMid slice" width="100%" />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
});
