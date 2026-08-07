import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
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
import type { PostRunChartPoint, PostRunChartTab } from '../../mock';
import { colors, spacing } from '../../theme';
import { FeedChartSlide } from './FeedChartSlide';

type RunMediaCarouselProps = {
  photoUrl?: string | null;
  routePoints: GpsPoint[];
  height: number;
  onPressPhoto?: () => void;
  onPressMap?: () => void;
  /** Shows a small expand icon on the map card — only meaningful when onPressMap opens a fullscreen map, not when it navigates elsewhere. */
  showMapExpandBadge?: boolean;
  /** Chart series for whichever of pace/elevation/heart-rate have data — each becomes its own swipeable slide. */
  chartData?: Record<PostRunChartTab, PostRunChartPoint[]>;
  chartReferenceLines?: Partial<Record<PostRunChartTab, number>>;
  distanceMiles?: number;
};

const CHART_TAB_ORDER: PostRunChartTab[] = ['pace', 'elevation', 'heartRate'];

const CARD_GAP = spacing.sm;
const MIN_NEXT_PEEK = 56;
const DEFAULT_ASPECT_RATIO = 4 / 3;

/** Persists resolved photo aspect ratios across renders/scroll-recycling so a
 *  previously-measured image never flashes at the wrong size while
 *  Image.getSize resolves again. */
const aspectRatioCache = new Map<string, number>();

export function RunMediaCarousel({
  photoUrl,
  routePoints,
  height,
  onPressPhoto,
  onPressMap,
  showMapExpandBadge = false,
  chartData,
  chartReferenceLines = {},
  distanceMiles = 0,
}: RunMediaCarouselProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [photoAspectRatio, setPhotoAspectRatio] = useState(
    photoUrl && aspectRatioCache.has(photoUrl)
      ? aspectRatioCache.get(photoUrl)!
      : DEFAULT_ASPECT_RATIO,
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const hasRoute = routePoints.length >= 2;
  const hasPhoto = Boolean(photoUrl);
  const chartTabs = useMemo(
    () => CHART_TAB_ORDER.filter((tab) => (chartData?.[tab]?.length ?? 0) > 0),
    [chartData],
  );

  useEffect(() => {
    if (!photoUrl) return;
    const cached = aspectRatioCache.get(photoUrl);
    if (cached) {
      setPhotoAspectRatio(cached);
      return;
    }
    let cancelled = false;
    Image.getSize(
      photoUrl,
      (naturalWidth, naturalHeight) => {
        if (!cancelled && naturalWidth > 0 && naturalHeight > 0) {
          const ratio = naturalWidth / naturalHeight;
          aspectRatioCache.set(photoUrl, ratio);
          setPhotoAspectRatio(ratio);
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

  const slideCount = (hasPhoto ? 1 : 0) + (hasRoute ? 1 : 0) + chartTabs.length;

  if (slideCount === 0) {
    return null;
  }

  function renderMapCard(width: DimensionValue) {
    return (
      <Pressable disabled={!onPressMap} onPress={onPressMap} style={[styles.card, { height, width }]}>
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
      <Pressable disabled={!onPressPhoto} onPress={onPressPhoto} style={[styles.card, { height, width }]}>
        <Image resizeMode="cover" source={{ uri: photoUrl! }} style={styles.fill} />
      </Pressable>
    );
  }

  function renderChartCard(tab: PostRunChartTab, width: DimensionValue) {
    return (
      <FeedChartSlide
        data={chartData?.[tab] ?? []}
        distanceMiles={distanceMiles}
        height={height}
        referenceLines={chartReferenceLines}
        tab={tab}
        width={width}
      />
    );
  }

  // Single-slide fast path — no layout measurement needed, matches prior behavior exactly.
  if (slideCount === 1) {
    if (hasPhoto) {
      const photoWidth = containerWidth
        ? Math.min(height * photoAspectRatio, containerWidth)
        : height * photoAspectRatio;
      return renderPhotoCard(photoWidth);
    }
    if (hasRoute) {
      return renderMapCard('100%');
    }
    return renderChartCard(chartTabs[0], '100%');
  }

  // Multi-slide path — photo (if present) gets an aspect-ratio width capped
  // so the next slide peeks at the edge; every other slide is full width.
  const photoCap = containerWidth ? Math.max(containerWidth - MIN_NEXT_PEEK, containerWidth * 0.3) : 0;
  const photoWidth = containerWidth
    ? Math.min(height * photoAspectRatio, photoCap)
    : height * photoAspectRatio;

  const slides: { key: string; width: number; node: React.ReactNode }[] = [];
  if (hasPhoto) {
    slides.push({ key: 'photo', width: photoWidth, node: renderPhotoCard(photoWidth) });
  }
  if (hasRoute) {
    slides.push({ key: 'route', width: containerWidth, node: renderMapCard(containerWidth) });
  }
  for (const tab of chartTabs) {
    slides.push({ key: tab, width: containerWidth, node: renderChartCard(tab, containerWidth) });
  }

  const snapOffsets = slides.reduce<number[]>((offsets, slide, index) => {
    if (index === 0) return [0];
    offsets.push(offsets[index - 1] + slides[index - 1].width + CARD_GAP);
    return offsets;
  }, []);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = event.nativeEvent.contentOffset.x;
    let nearest = 0;
    let nearestDistance = Infinity;
    snapOffsets.forEach((offset, index) => {
      const distance = Math.abs(offset - x);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = index;
      }
    });
    setActiveIndex(nearest);
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
            snapToOffsets={snapOffsets}
            contentContainerStyle={styles.scrollContent}
          >
            {slides.map((slide) => (
              <View key={slide.key}>{slide.node}</View>
            ))}
          </ScrollView>
          <View style={styles.dots}>
            {slides.map((slide, index) => (
              <View key={slide.key} style={[styles.dot, index === activeIndex && styles.dotActive]} />
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
