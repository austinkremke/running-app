import { Image, StyleSheet, View } from 'react-native';

import { StaticRouteMapPreview } from '../map';
import type { GpsPoint } from '../../maps/types';
import { colors, spacing } from '../../theme';

type RunCardMediaProps = {
  routePoints: GpsPoint[];
  photoUrl?: string;
};

const MAP_HEIGHT = 152;
const PHOTO_HEIGHT = 88;

export function RunCardMedia({ routePoints, photoUrl }: RunCardMediaProps) {
  return (
    <View style={styles.container}>
      <StaticRouteMapPreview routePoints={routePoints} style={styles.map} />
      {photoUrl ? (
        <View style={styles.photoTile}>
          <Image source={{ uri: photoUrl }} style={styles.image} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  map: {
    height: MAP_HEIGHT,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoTile: {
    height: PHOTO_HEIGHT,
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
