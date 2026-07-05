import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useInitialMapRegion } from '../../hooks/useInitialMapRegion';
import { activeMapProvider } from '../../maps';
import { regionFromRoutePoints } from '../../maps/mapCamera';
import type { GpsPoint } from '../../maps/types';
import { colors } from '../../theme';

type FullscreenRouteMapProps = {
  visible: boolean;
  routePoints: GpsPoint[];
  onClose: () => void;
};

export function FullscreenRouteMap({ visible, routePoints, onClose }: FullscreenRouteMapProps) {
  const insets = useSafeAreaInsets();
  const { region: initialRegion } = useInitialMapRegion();
  const MapView = activeMapProvider.MapView;
  const progress = useRef(new Animated.Value(0)).current;

  const region = useMemo(
    () => regionFromRoutePoints(routePoints, 1.12) ?? initialRegion,
    [initialRegion, routePoints],
  );

  useEffect(() => {
    if (visible) {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [progress, visible]);

  if (!visible) {
    return null;
  }

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: progress,
            transform: [
              {
                scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }),
              },
            ],
          },
        ]}
      >
        <MapView interactive region={region} routePoints={routePoints} showRouteEndpoints showsUserLocation={false} />

        <Pressable
          accessibilityLabel="Close full screen map"
          accessibilityRole="button"
          hitSlop={10}
          onPress={onClose}
          style={[styles.closeButton, { top: insets.top + 12 }]}
        >
          <Ionicons color={colors.textPrimary} name="close" size={22} />
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  closeButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
