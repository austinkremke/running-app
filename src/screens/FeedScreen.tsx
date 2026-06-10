import { FlatList, StyleSheet } from 'react-native';

import { RunCard } from '../components/feed';
import { getRunsForTab, type FeedTab } from '../mock';
import { colors, spacing } from '../theme';

type FeedScreenProps = {
  activeTab: FeedTab;
};

export function FeedScreen({ activeTab }: FeedScreenProps) {
  const runs = getRunsForTab(activeTab);

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={runs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <RunCard run={item} />}
      showsVerticalScrollIndicator={false}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
});
