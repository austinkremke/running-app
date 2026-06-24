import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme';

const DOT_COLOR = colors.accentLime;

export function RouteEndpointDot() {
  return (
    <View style={styles.marker}>
      <View style={styles.dotBorder}>
        <View style={styles.dot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotBorder: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: DOT_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(215, 255, 47, 0.2)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DOT_COLOR,
  },
});
