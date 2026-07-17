import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TeamMembersSection, TeamStatsSection, TeamTopSection } from '../components/team';
import { MOCK_TEAM_SCREENSHOT } from '../mock';
import { colors, spacing } from '../theme';

type DevTeamScreenshotScreenProps = {
  onBack: () => void;
};

export function DevTeamScreenshotScreen({ onBack }: DevTeamScreenshotScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Back" accessibilityRole="button" hitSlop={8} onPress={onBack}>
          <Ionicons color={colors.textPrimary} name="chevron-back" size={24} />
        </Pressable>
        <Text style={styles.title}>TEAM</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TeamTopSection team={MOCK_TEAM_SCREENSHOT} />
        <TeamStatsSection stats={MOCK_TEAM_SCREENSHOT.stats} />
        <TeamMembersSection
          memberCount={MOCK_TEAM_SCREENSHOT.memberCount}
          memberMax={MOCK_TEAM_SCREENSHOT.memberMax}
          members={MOCK_TEAM_SCREENSHOT.members}
        />
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
});
