import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePurchases } from '../../context';
import { PaywallScreen } from '../premium';
import { fetchSoloRatingHistory, type SoloRatingHistoryEntry } from '../../services/rank';
import { RankBorderAvatar } from '../team/RankBorderAvatar';
import { colors, spacing } from '../../theme';
import { MatchHistoryRow } from './MatchHistoryRow';
import { RatingHistoryChart } from './RatingHistoryChart';

const SUMMARY_AVATAR_SIZE = 36;

type CompetitiveHistoryModalProps = {
  visible: boolean;
  userId: string | null;
  viewerAvatarUrl?: string;
  viewerRankTierId?: string;
  onClose: () => void;
  onOpenMatch?: (matchId: string) => void;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatSignedDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

export function CompetitiveHistoryModal({
  visible,
  userId,
  viewerAvatarUrl,
  viewerRankTierId,
  onClose,
  onOpenMatch,
}: CompetitiveHistoryModalProps) {
  const insets = useSafeAreaInsets();
  const { isPremium } = usePurchases();
  const [entries, setEntries] = useState<SoloRatingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !userId) return;

    let cancelled = false;
    setLoading(true);

    fetchSoloRatingHistory(userId)
      .then((rows) => {
        if (cancelled) return;
        setEntries(rows);
        setSelectedMatchId(rows[0]?.matchId ?? null);
      })
      .catch((error) => {
        console.warn('Failed to load competitive history', error);
        if (!cancelled) {
          setEntries([]);
          setSelectedMatchId(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, userId]);

  // Chart wants oldest-first; the list below (and "latest") wants newest-first.
  const ascendingEntries = useMemo(() => [...entries].reverse(), [entries]);
  const latestEntry = entries[0] ?? null;
  const selectedEntry = entries.find((entry) => entry.matchId === selectedMatchId) ?? latestEntry;

  if (!isPremium) {
    return (
      <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
        <PaywallScreen message="Unlock your competitive history and rating trend!" onClose={onClose} />
      </Modal>
    );
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" hitSlop={8} onPress={onClose}>
            <Ionicons color={colors.textPrimary} name="chevron-back" size={22} />
          </Pressable>
          <Text numberOfLines={1} style={styles.title}>
            COMPETITIVE HISTORY
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accentLime} />
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Play some ranked solo matches to build your rating history.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {latestEntry ? (
              <View style={styles.heroCard}>
                <Text style={styles.heroLabel}>CURRENT RATING</Text>
                <Text style={styles.heroValue}>{latestEntry.ratingAfter.toLocaleString()}</Text>
                <Text style={styles.heroMeta}>Last match {formatDate(latestEntry.endedAt)}</Text>
              </View>
            ) : null}

            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>RATING OVER TIME</Text>
              <RatingHistoryChart
                entries={ascendingEntries}
                onSelectPoint={setSelectedMatchId}
                selectedMatchId={selectedMatchId}
              />
            </View>

            {selectedEntry ? (
              <View style={styles.summaryCard}>
                <View style={styles.summaryAvatarPair}>
                  <RankBorderAvatar
                    avatarUrl={viewerAvatarUrl}
                    rankTierId={viewerRankTierId}
                    size={SUMMARY_AVATAR_SIZE}
                  />
                  <RankBorderAvatar
                    avatarUrl={selectedEntry.opponentAvatarUrl ?? undefined}
                    rankTierId={selectedEntry.opponentRankTierId}
                    size={SUMMARY_AVATAR_SIZE}
                  />
                </View>

                <View style={styles.summaryHeader}>
                  <Text style={styles.summaryOpponent}>vs {selectedEntry.opponentName}</Text>
                  <Text
                    style={[
                      styles.summaryDelta,
                      selectedEntry.ratingDelta > 0 ? styles.deltaPositive : styles.deltaNegative,
                    ]}
                  >
                    {formatSignedDelta(selectedEntry.ratingDelta)}
                  </Text>
                </View>
                <Text style={styles.summaryMeta}>
                  {selectedEntry.result.toUpperCase()} · {selectedEntry.myPoints}-{selectedEntry.opponentPoints} ·{' '}
                  {formatDate(selectedEntry.endedAt)}
                </Text>
                <Text style={styles.summaryMeta}>
                  {selectedEntry.ratingBefore.toLocaleString()} → {selectedEntry.ratingAfter.toLocaleString()} rating
                </Text>

                {onOpenMatch ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onOpenMatch(selectedEntry.matchId)}
                    style={({ pressed }) => [styles.viewMatchButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.viewMatchLabel}>View Match Details</Text>
                    <Ionicons color={colors.background} name="chevron-forward" size={14} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <Text style={styles.listTitle}>ALL MATCHES</Text>
            <View style={styles.list}>
              {entries.map((entry) => {
                const isSelected = entry.matchId === selectedMatchId;
                return (
                  <View key={entry.matchId} style={[styles.rowCard, isSelected && styles.rowCardSelected]}>
                    <MatchHistoryRow
                      entry={entry}
                      onPress={() => setSelectedMatchId(entry.matchId)}
                      viewerAvatarUrl={viewerAvatarUrl}
                      viewerRankTierId={viewerRankTierId}
                    />
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  headerSpacer: {
    width: 22,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
  heroLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroValue: {
    color: colors.accentLime,
    fontSize: 30,
    fontWeight: '800',
    fontStyle: 'italic',
    marginTop: 2,
  },
  heroMeta: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  chartSection: {
    gap: spacing.sm,
  },
  chartTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accentLime,
    padding: spacing.md,
    gap: 4,
  },
  summaryAvatarPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryOpponent: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  summaryDelta: {
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  deltaPositive: {
    color: colors.accentLime,
  },
  deltaNegative: {
    color: colors.textSecondary,
  },
  summaryMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  viewMatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.accentLime,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.85,
  },
  viewMatchLabel: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '800',
  },
  listTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  list: {
    gap: spacing.sm,
  },
  rowCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowCardSelected: {
    borderColor: colors.accentLime,
  },
});
