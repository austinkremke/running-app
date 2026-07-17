import { useEffect, useRef } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme';
import { RunOffLogo } from './RunOffLogo';

const SLIDES = [
  {
    image: require('../../../assets/lifestyle-1-v2.png'),
    screenshot: require('../../../assets/appscreenshot-solo.png'),
    caption: 'Compete in head-to-head matches.',
  },
  {
    image: require('../../../assets/lifestyle-3-v2.png'),
    screenshot: require('../../../assets/appscreenshot-runroute.png'),
    caption: 'Stay motivated through competition.',
  },
  {
    image: require('../../../assets/lifestyle-2-v2.png'),
    screenshot: require('../../../assets/appscreenshot-team.png'),
    caption: 'Join a team. Win together.',
  },
  {
    image: require('../../../assets/lifestyle-4-v2.png'),
    screenshot: require('../../../assets/appscreenshot-rankup.png'),
    caption: 'Climb the global rankings.',
  },
];

const AUTO_ADVANCE_INTERVAL_MS = 4000;
const SCREENSHOT_ASPECT_RATIO = 9 / 19.5;
const SCREENSHOT_WIDTH_RATIO = 0.56;
// Small, fixed "barely hanging down" overlap rather than a big percentage.
const SCREENSHOT_OVERHANG = 36;
const CAPTION_AREA_HEIGHT = 108;
const LOGO_SCREENSHOT_GAP = spacing.md;
// Shifts the logo/screenshot/caption stack down as a group (~1rem).
const VERTICAL_SHIFT = 16;

type LifestyleCarouselProps = {
  photoHeight: number;
  activeIndex: number;
  onIndexChange: (index: number) => void;
};

// One clone of the first slide appended at the end — scrolling onto it looks
// like continuing forward, then we snap back to the real first slide with no
// animation so the loop reads as seamless.
const EXTENDED_SLIDES = [...SLIDES, SLIDES[0]];

export function LifestyleCarousel({ photoHeight, activeIndex, onIndexChange }: LifestyleCarouselProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const trackIndexRef = useRef(0);
  const screenshotWidth = width * SCREENSHOT_WIDTH_RATIO;
  const screenshotHeight = screenshotWidth / SCREENSHOT_ASPECT_RATIO;
  const slideHeight = photoHeight + CAPTION_AREA_HEIGHT;
  const screenshotTop = photoHeight - screenshotHeight + SCREENSHOT_OVERHANG + VERTICAL_SHIFT;

  useEffect(() => {
    const interval = setInterval(() => {
      const nextTrackIndex = trackIndexRef.current + 1;
      trackIndexRef.current = nextTrackIndex;
      scrollRef.current?.scrollTo({ x: nextTrackIndex * width, animated: true });

      if (nextTrackIndex < SLIDES.length) {
        onIndexChange(nextTrackIndex);
      }
    }, AUTO_ADVANCE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [onIndexChange, width]);

  function handleMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const settledIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    trackIndexRef.current = settledIndex;

    if (settledIndex === SLIDES.length) {
      scrollRef.current?.scrollTo({ x: 0, animated: false });
      trackIndexRef.current = 0;
      onIndexChange(0);
      return;
    }

    if (settledIndex !== activeIndex) {
      onIndexChange(settledIndex);
    }
  }

  return (
    <View style={[styles.container, { height: slideHeight }]}>
      <ScrollView
        horizontal
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        pagingEnabled
        ref={scrollRef}
        showsHorizontalScrollIndicator={false}
      >
        {EXTENDED_SLIDES.map((slide, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <View key={index} style={{ width, height: slideHeight }}>
            <Image
              resizeMode="cover"
              source={slide.image}
              style={{ width, height: photoHeight }}
            />

            <View style={[styles.screenshotSlot, { top: screenshotTop }]}>
              <Image
                resizeMode="cover"
                source={slide.screenshot}
                style={[styles.screenshotImage, { width: screenshotWidth, height: screenshotHeight }]}
              />
            </View>

            <View style={[styles.captionSlot, { top: photoHeight + SCREENSHOT_OVERHANG + VERTICAL_SHIFT }]}>
              <Text adjustsFontSizeToFit minimumFontScale={0.6} numberOfLines={1} style={styles.caption}>
                {slide.caption}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View
        pointerEvents="none"
        style={[
          styles.logoOverlay,
          {
            top: insets.top + spacing.md + VERTICAL_SHIFT,
            height: screenshotTop - LOGO_SCREENSHOT_GAP - insets.top - spacing.md - VERTICAL_SHIFT,
          },
        ]}
      >
        <RunOffLogo size={52} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  logoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  screenshotSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  screenshotImage: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: colors.background,
  },
  captionSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  caption: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
