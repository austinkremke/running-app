import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { GpsPoint } from '../../maps/types';
import { useInitialMapRegion } from '../../hooks/useInitialMapRegion';
import { activeMapProvider } from '../../maps';
import { colors, spacing } from '../../theme';

type PostRunMediaCarouselProps = {
  photos: string[];
  routePoints: GpsPoint[];
  weatherTempF: number;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const CARD_HEIGHT = 176;
const CARD_GAP = spacing.sm;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

export function PostRunMediaCarousel({
  photos,
  routePoints,
  weatherTempF,
}: PostRunMediaCarouselProps) {
  const { region } = useInitialMapRegion();
  const MapView = activeMapProvider.MapView;
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = 1 + photos.length;

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
          <MapView region={region} routePoints={routePoints} />
          <View style={styles.expandButton}>
            <Ionicons color={colors.textPrimary} name="expand-outline" size={16} />
          </View>
          <View style={styles.weatherPill}>
            <Ionicons color={colors.accentGold} name="sunny-outline" size={14} />
            <Text style={styles.weatherText}>{weatherTempF}°F</Text>
          </View>
        </View>

        {photos.map((photoUrl) => (
          <View key={photoUrl} style={styles.card}>
            <Image resizeMode="cover" source={{ uri: photoUrl }} style={styles.photo} />
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {Array.from({ length: slideCount }, (_, index) => (
          <View
            key={`dot-${index}`}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
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
});
