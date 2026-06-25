import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { TabAppHeader } from '../components/header';
import { TopTeamsSearchRow, TopTeamsTeamCard } from '../components/team/top-teams';
import { TOP_TEAMS_PAGE_SIZE, type TopTeamsTab, type TopTeamListing } from '../mock';
import { listTopTeams } from '../services/teamService';
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
  const [teams, setTeams] = useState<TopTeamListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTeams() {
      setLoading(true);
      try {
        const rows = await listTopTeams();
        if (!cancelled) {
          setTeams(rows);
        }
      } catch {
        if (!cancelled) {
          setTeams([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTeams();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTeams = useMemo(
    () => filterTeams(teams, query, activeTab),
    [activeTab, query, teams],
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

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accentLime} />
        </View>
      ) : (
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
      )}
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
