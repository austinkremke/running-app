import { Image, StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../theme';

type RunCardMediaProps = {
  photoUrl?: string;
};

export function RunCardMedia({ photoUrl }: RunCardMediaProps) {
  return (
    <View style={styles.container}>
      <View style={styles.tile}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <View style={[styles.tile, styles.placeholder]} />
      <View style={[styles.tile, styles.placeholder]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.xs,
    height: 108,
  },
  tile: {
    flex: 1,
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
  placeholder: {
    backgroundColor: colors.surfaceElevated,
  },
});
