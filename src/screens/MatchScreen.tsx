import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

export function MatchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Match Screen</Text>
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
