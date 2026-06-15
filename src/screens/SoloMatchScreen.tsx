import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  SoloActiveMatchActions,
  SoloMatchActivitySection,
  SoloMatchChatDrawer,
  SoloMatchHighlightsRow,
  SoloMatchScoreboard,
  SoloMatchStatsSection,
} from '../components/match/solo';
import { MOCK_ACTIVE_SOLO_MATCH, type ActiveSoloMatch } from '../mock';
import { colors, spacing } from '../theme';

type SoloMatchScreenProps = {
  match?: ActiveSoloMatch;
  onRunPress?: () => void;
  embedded?: boolean;
};

export function SoloMatchScreen({
  match = MOCK_ACTIVE_SOLO_MATCH,
  onRunPress,
  embedded = false,
}: SoloMatchScreenProps) {
  const [chatVisible, setChatVisible] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <SoloMatchScoreboard match={match} />

        <SoloMatchStatsSection match={match} />
        <SoloMatchActivitySection activities={match.activities} />
        <SoloMatchHighlightsRow highlights={match.highlights} />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {!embedded ? (
        <SoloActiveMatchActions onMessage={() => setChatVisible(true)} onRun={onRunPress} />
      ) : null}

      <SoloMatchChatDrawer
        onClose={() => setChatVisible(false)}
        opponentName={match.awayRunner.name}
        visible={chatVisible}
      />
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
  bottomSpacer: {
    height: spacing.sm,
  },
});
