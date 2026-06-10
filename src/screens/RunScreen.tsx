import { StyleSheet, View } from 'react-native';

import { RunBottomDrawer, RunMapPlaceholder } from '../components/run';
import { colors } from '../theme';

type RunScreenProps = {
  onBack?: () => void;
};

export function RunScreen({ onBack }: RunScreenProps) {
  return (
    <View style={styles.container}>
      <RunMapPlaceholder onBack={onBack} />
      <RunBottomDrawer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
