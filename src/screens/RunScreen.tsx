import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

export function RunScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Run Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
});
