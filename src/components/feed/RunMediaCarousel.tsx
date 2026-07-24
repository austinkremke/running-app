import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type DimensionValue,
} from 'react-native';

import { StaticRouteMapPreview } from '../map';
import type { GpsPoint } from '../../maps/types';
import { colors, spacing } from '../../theme';

type RunMediaCarouselProps = {
  photoUrl?: string | null;
  routePoints: GpsPoint[];
  height: number;
  onPressPhoto?: () => void;
  onPressMap?: () => void;
  /** Shows a small expand icon on the map card — only meaningful when onPressMap opens a fullscreen map, not when it navigates elsewhere. */
  showMapExpandBadge?: boolean;
};

const CARD_GAP = spacing.sm;
const MIN_MAP_PEEK = 56;
const DEFAULT_ASPECT_RATIO = 4 / 3;

export function RunMediaCarousel({
  photoUrl,
  routePoints,
  height,
  onPressPhoto,
  onPressMap,
  showMapExpandBadge = false,
}: RunMediaCarouselProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [photoAspectRatio, setPhotoAspectRatio] = useState(DEFAULT_ASPECT_RATIO);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasRoute = routePoints.length >= 2;
  const hasPhoto = Boolean(photoUrl);

  useEffect(() => {
    if (!photoUrl) return;
    let cancelled = false;
    Image.getSize(
      photoUrl,
      (naturalWidth, naturalHeight) => {
        if (!cancelled && naturalWidth > 0 && naturalHeight > 0) {
          setPhotoAspectRatio(naturalWidth / naturalHeight);
        }
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [photoUrl]);

  function handleLayout(event: LayoutChangeEvent) {
    setContainerWidth(event.nativeEvent.layout.width);
  }

  if (!hasPhoto && !hasRoute) {
    return null;
  }

  function renderMapCard(width: DimensionValue) {
    return (
      <Pressable
        disabled={!onPressMap}
        onPress={onPressMap}
        style={[styles.card, { height, width }]}
      >
        <StaticRouteMapPreview routePoints={routePoints} style={styles.fill} />
        {showMapExpandBadge && onPressMap ? (
          <View style={styles.expandBadge}>
            <Ionicons color={colors.textPrimary} name="expand" size={14} />
          </View>
        ) : null}
      </Pressable>
    );
  }

  function renderPhotoCard(width: DimensionValue) {
    return (
      <Pressable
        disabled={!onPressPhoto}
        onPress={onPressPhoto}
        style={[styles.card, { height, width }]}
      >
        <Image resizeMode="cover" source={{ uri: photoUrl! }} style={styles.fill} />
      </Pressable>
    );
  }

  if (hasPhoto && !hasRoute) {
    const photoWidth = containerWidth
      ? Math.min(height * photoAspectRatio, containerWidth)
      : height * photoAspectRatio;
    return renderPhotoCard(photoWidth);
  }

  if (hasRoute && !hasPhoto) {
    return renderMapCard('100%');
  }

  const photoCap = containerWidth ? Math.max(containerWidth - MIN_MAP_PEEK, containerWidth * 0.3) : 0;
  const photoWidth = containerWidth
    ? Math.min(height * photoAspectRatio, photoCap)
    : height * photoAspectRatio;
  const snapOffset = photoWidth + CARD_GAP;

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setActiveIndex(event.nativeEvent.contentOffset.x >= snapOffset / 2 ? 1 : 0);
  }

  return (
    <View onLayout={handleLayout}>
      {containerWidth > 0 ? (
        <>
          <ScrollView
            decelerationRate="fast"
            horizontal
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            snapToOffsets={[0, snapOffset]}
            contentContainerStyle={styles.scrollContent}
          >
            {renderPhotoCard(photoWidth)}
            {renderMapCard(containerWidth)}
          </ScrollView>
          <View style={styles.dots}>
            {[0, 1].map((index) => (
              <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrollContent: {
    gap: CARD_GAP,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  expandBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.divider,
  },
  dotActive: {
    backgroundColor: colors.accentLime,
  },
});
