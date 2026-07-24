import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { PlayerLeaderboardCard } from '../components/leaderboards';
import { TopTeamsSearchRow, TopTeamsTeamCard } from '../components/team/top-teams';
import type { TopPlayerListing, TopTeamListing } from '../mock';
import { listTopPlayers } from '../services/rank';
import { listTopTeams } from '../services/teamService';
import { colors, spacing } from '../theme';

const LEADERBOARD_MODES = [
  { key: 'solo', label: 'Solo' },
  { key: 'team', label: 'Team' },
] as const;

type LeaderboardMode = (typeof LEADERBOARD_MODES)[number]['key'];

type LeaderboardsScreenProps = {
  onOpenProfile?: (userId: string) => void;
  onOpenTeam?: (teamId: string) => void;
};

function filterPlayers(players: TopPlayerListing[], query: string): TopPlayerListing[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return players;
  return players.filter((player) => player.name.toLowerCase().includes(normalized));
}

function filterTeams(teams: TopTeamListing[], query: string): TopTeamListing[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return teams;
  return teams.filter(
    (team) =>
      team.name.toLowerCase().includes(normalized) ||
      team.tag.toLowerCase().includes(normalized) ||
      team.motto.toLowerCase().includes(normalized),
  );
}

export function LeaderboardsScreen({ onOpenProfile, onOpenTeam }: LeaderboardsScreenProps) {
  const [mode, setMode] = useState<LeaderboardMode>('solo');
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState<TopPlayerListing[]>([]);
  const [teams, setTeams] = useState<TopTeamListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = mode === 'solo' ? listTopPlayers() : listTopTeams();

    load
      .then((rows) => {
        if (cancelled) return;
        if (mode === 'solo') {
          setPlayers(rows as TopPlayerListing[]);
        } else {
          setTeams(rows as TopTeamListing[]);
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (mode === 'solo') setPlayers([]);
        else setTeams([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode]);

  const visiblePlayers = useMemo(() => filterPlayers(players, query), [players, query]);
  const visibleTeams = useMemo(() => filterTeams(teams, query), [teams, query]);

  function handleModePress(key: LeaderboardMode) {
    setMode(key);
    setQuery('');
  }

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <View style={styles.row}>
          <View style={styles.searchField}>
            <TopTeamsSearchRow
              onQueryChange={setQuery}
              placeholder={mode === 'solo' ? 'Search players...' : 'Search teams...'}
              query={query}
            />
          </View>

          <View style={styles.pillGroup}>
            {LEADERBOARD_MODES.map((item) => {
              const isActive = item.key === mode;
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => handleModePress(item.key)}
                  style={[styles.pill, isActive && styles.pillActive]}
                >
                  <Text style={[styles.pillLabel, isActive && styles.pillLabelActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accentLime} />
        </View>
      ) : mode === 'solo' ? (
        <FlatList
          contentContainerStyle={[styles.listContent, visiblePlayers.length === 0 && styles.emptyContent]}
          data={visiblePlayers}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.message}>No ranked players yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <PlayerLeaderboardCard
              onPress={onOpenProfile ? () => onOpenProfile(item.id) : undefined}
              player={item}
            />
          )}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      ) : (
        <FlatList
          contentContainerStyle={[styles.listContent, visibleTeams.length === 0 && styles.emptyContent]}
          data={visibleTeams}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.message}>No ranked teams yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TopTeamsTeamCard onPress={onOpenTeam ? () => onOpenTeam(item.id) : undefined} team={item} />
          )}
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
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchField: {
    flex: 1,
  },
  pillGroup: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
    gap: 2,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pillActive: {
    backgroundColor: colors.accentLime,
  },
  pillLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  pillLabelActive: {
    color: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
