import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  TeamChatDrawer,
  TeamMatchActions,
  TeamMatchLiveActivitySection,
  TeamMatchRosters,
  TeamMatchScoreboard,
} from '../components/match/team';
import { MOCK_ACTIVE_TEAM_MATCH } from '../mock';
import { colors, spacing } from '../theme';

type TeamMatchScreenProps = {
  onRunPress?: () => void;
};

export function TeamMatchScreen({ onRunPress }: TeamMatchScreenProps) {
  const match = MOCK_ACTIVE_TEAM_MATCH;
  const [chatVisible, setChatVisible] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.matchTop}>
          <TeamMatchScoreboard match={match} />
          <TeamMatchRosters awayTeam={match.awayTeam} homeTeam={match.homeTeam} />
        </View>
        <TeamMatchLiveActivitySection activities={match.activities} />
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <TeamMatchActions onRun={onRunPress} onTeamChat={() => setChatVisible(true)} />
      <TeamChatDrawer onClose={() => setChatVisible(false)} visible={chatVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  matchTop: {
    gap: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.sm,
  },
});
