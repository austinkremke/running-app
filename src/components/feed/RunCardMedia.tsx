import { Image, StyleSheet, View } from 'react-native';

import { StaticRouteMapPreview } from '../map';
import type { GpsPoint } from '../../maps/types';
import { colors, spacing } from '../../theme';

type RunCardMediaProps = {
  routePoints: GpsPoint[];
  photoUrl?: string;
};

const MAP_HEIGHT = 152;
const PHOTO_WIDTH = 112;

export function RunCardMedia({ routePoints, photoUrl }: RunCardMediaProps) {
  if (photoUrl) {
    return (
      <View style={styles.row}>
        <StaticRouteMapPreview routePoints={routePoints} style={styles.mapWithPhoto} />
        <View style={styles.photoTile}>
          <Image source={{ uri: photoUrl }} style={styles.image} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StaticRouteMapPreview routePoints={routePoints} style={styles.map} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    height: MAP_HEIGHT,
  },
  map: {
    height: MAP_HEIGHT,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapWithPhoto: {
    flex: 1,
    height: MAP_HEIGHT,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoTile: {
    width: PHOTO_WIDTH,
    height: MAP_HEIGHT,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
