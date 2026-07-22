import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { GpsPoint } from '../../maps/types';
import { useInitialMapRegion } from '../../hooks/useInitialMapRegion';
import { activeMapProvider } from '../../maps';
import { regionFromRoutePoints } from '../../maps/mapCamera';
import { colors, spacing } from '../../theme';

type PostRunMediaCarouselProps = {
  photoUri?: string | null;
  routePoints: GpsPoint[];
  weatherTempF?: number;
  onAddPhoto?: () => void;
  onRemovePhoto?: () => void;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const CARD_HEIGHT = 176;
const CARD_GAP = spacing.sm;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

export function PostRunMediaCarousel({
  photoUri,
  routePoints,
  weatherTempF,
  onAddPhoto,
  onRemovePhoto,
}: PostRunMediaCarouselProps) {
  const { region: initialRegion } = useInitialMapRegion();
  const region = useMemo(
    () => regionFromRoutePoints(routePoints, 1.08) ?? initialRegion,
    [initialRegion, routePoints],
  );
  const MapView = activeMapProvider.MapView;
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = photoUri ? 2 : 1;

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / SNAP_INTERVAL);
    setActiveIndex(Math.max(0, Math.min(index, slideCount - 1)));
  }

  return (
    <View style={styles.container}>
      <ScrollView
        decelerationRate="fast"
        horizontal
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={SNAP_INTERVAL}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <MapView
            followRoute={false}
            region={region}
            routePoints={routePoints}
            showRouteEndpoints={routePoints.length >= 2}
            showsUserLocation={false}
          />
          <View style={styles.expandButton}>
            <Ionicons color={colors.textPrimary} name="expand-outline" size={16} />
          </View>
          {weatherTempF != null ? (
            <View style={styles.weatherPill}>
              <Ionicons color={colors.accentGold} name="sunny-outline" size={14} />
              <Text style={styles.weatherText}>{weatherTempF}°F</Text>
            </View>
          ) : null}
        </View>

        {photoUri ? (
          <View style={styles.card}>
            <Image resizeMode="cover" source={{ uri: photoUri }} style={styles.photo} />
          </View>
        ) : null}
      </ScrollView>

      {slideCount > 1 ? (
        <View style={styles.dots}>
          {Array.from({ length: slideCount }, (_, index) => (
            <View
              key={`dot-${index}`}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}

      {photoUri ? (
        <Pressable
          accessibilityLabel="Remove photo"
          accessibilityRole="button"
          onPress={onRemovePhoto}
          style={styles.photoActionButton}
        >
          <Ionicons color={colors.textSecondary} name="trash-outline" size={14} />
          <Text style={styles.photoActionText}>Remove photo</Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityLabel="Add a photo to this run"
          accessibilityRole="button"
          onPress={onAddPhoto}
          style={styles.photoActionButton}
        >
          <Ionicons color={colors.accentLime} name="camera-outline" size={14} />
          <Text style={[styles.photoActionText, styles.photoActionTextAccent]}>Add photo</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  expandButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 7, 11, 0.55)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  weatherPill: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(5, 7, 11, 0.65)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  weatherText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
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
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoActionText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  photoActionTextAccent: {
    color: colors.accentLime,
  },
});
