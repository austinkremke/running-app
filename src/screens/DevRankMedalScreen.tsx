import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RankMedal3D } from '../components/medal';
import { colors, spacing } from '../theme';

type DevRankMedalScreenProps = {
  onBack: () => void;
};

export function DevRankMedalScreen({ onBack }: DevRankMedalScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Back" accessibilityRole="button" hitSlop={8} onPress={onBack}>
          <Ionicons color={colors.textPrimary} name="chevron-back" size={24} />
        </Pressable>
        <Text style={styles.title}>3D RANK MEDAL</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <RankMedal3D color="#F5C842" size={240} />
        <Text style={styles.hint}>Swipe left/right to spin. Flick for momentum.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.6,
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
