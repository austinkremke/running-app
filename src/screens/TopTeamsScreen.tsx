import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { TabAppHeader } from '../components/header';
import { TopTeamsSearchRow, TopTeamsTeamCard } from '../components/team/top-teams';
import { MOCK_TOP_TEAMS, TOP_TEAMS_PAGE_SIZE, type TopTeamsTab, type TopTeamListing } from '../mock';
import { colors, spacing } from '../theme';

const TOP_TEAMS_TABS = [
  { key: 'rankings', label: 'RANKINGS' },
  { key: 'trending', label: 'TRENDING' },
  { key: 'new', label: 'NEW' },
  { key: 'nearby', label: 'NEARBY' },
] as const;

function filterTeams(teams: TopTeamListing[], query: string, tab: TopTeamsTab): TopTeamListing[] {
  const normalizedQuery = query.trim().toLowerCase();

  let results = teams;

  if (normalizedQuery) {
    results = results.filter(
      (team) =>
        team.name.toLowerCase().includes(normalizedQuery) ||
        team.tag.toLowerCase().includes(normalizedQuery) ||
        team.motto.toLowerCase().includes(normalizedQuery),
    );
  }

  if (tab === 'trending') {
    return [...results].sort((a, b) => b.totalPoints - a.totalPoints);
  }

  if (tab === 'new') {
    return [...results].sort((a, b) => b.level - a.level);
  }

  if (tab === 'nearby') {
    return [...results].reverse();
  }

  return [...results].sort((a, b) => a.rank - b.rank);
}

export function TopTeamsScreen() {
  const [activeTab, setActiveTab] = useState<TopTeamsTab>('rankings');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(TOP_TEAMS_PAGE_SIZE);

  const filteredTeams = useMemo(
    () => filterTeams(MOCK_TOP_TEAMS, query, activeTab),
    [activeTab, query],
  );

  const visibleTeams = useMemo(
    () => filteredTeams.slice(0, visibleCount),
    [filteredTeams, visibleCount],
  );

  const hasMore = visibleCount < filteredTeams.length;

  function resetVisibleCount() {
    setVisibleCount(TOP_TEAMS_PAGE_SIZE);
  }

  function handleTabPress(key: string) {
    setActiveTab(key as TopTeamsTab);
    resetVisibleCount();
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    resetVisibleCount();
  }

  function loadMore() {
    if (!hasMore) {
      return;
    }

    setVisibleCount((current) => Math.min(current + TOP_TEAMS_PAGE_SIZE, filteredTeams.length));
  }

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <TopTeamsSearchRow onQueryChange={handleQueryChange} query={query} />
        <TabAppHeader
          accentActive
          activeTab={activeTab}
          compact
          onTabPress={handleTabPress}
          showBorder={false}
          tabs={[...TOP_TEAMS_TABS]}
        />
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={visibleTeams}
        keyExtractor={(item) => item.id}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => <TopTeamsTeamCard team={item} />}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  controls: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
});
