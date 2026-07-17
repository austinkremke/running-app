import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SoloMatchActivitySection, SoloMatchScoreboard, SoloMatchStatsSection } from '../components/match/solo';
import { MOCK_SOLO_MATCH_SCREENSHOT } from '../mock';
import { colors, spacing } from '../theme';

type DevSoloMatchScreenshotScreenProps = {
  onBack: () => void;
};

export function DevSoloMatchScreenshotScreen({ onBack }: DevSoloMatchScreenshotScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Back" accessibilityRole="button" hitSlop={8} onPress={onBack}>
          <Ionicons color={colors.textPrimary} name="chevron-back" size={24} />
        </Pressable>
        <Text style={styles.title}>1V1 MATCH</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <SoloMatchScoreboard match={MOCK_SOLO_MATCH_SCREENSHOT} />
        </View>

        <View style={styles.statsWrap}>
          <SoloMatchStatsSection match={MOCK_SOLO_MATCH_SCREENSHOT} />
        </View>

        <View style={styles.activityWrap}>
          <SoloMatchActivitySection activities={MOCK_SOLO_MATCH_SCREENSHOT.activities} />
        </View>
      </ScrollView>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statsWrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  activityWrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
});
