import { ScrollView, StyleSheet, View } from 'react-native';

import {
  TeamActivitySection,
  TeamMembersSection,
  TeamStatsSection,
  TeamTopSection,
} from '../components/team';
import { MOCK_TEAM } from '../mock';
import { colors, spacing } from '../theme';

export function TeamScreen() {
  const team = MOCK_TEAM;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      <TeamTopSection team={team} />
      <TeamStatsSection stats={team.stats} />
      <TeamMembersSection
        memberCount={team.memberCount}
        memberMax={team.memberMax}
        members={team.members}
      />
      <TeamActivitySection activities={team.activities} />
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  bottomSpacer: {
    height: spacing.md,
  },
});
