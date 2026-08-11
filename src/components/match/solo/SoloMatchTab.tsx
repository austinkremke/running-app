import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ChallengeFriend } from '../../../mock';
import { MOCK_SOLO_MATCHMAKING } from '../../../mock';
import type { TeamMatchFormat } from '../../../mock';
import { useAuth } from '../../../context';
import { useActiveSoloMatch } from '../../../hooks/useActiveSoloMatch';
import { useFeatureGate } from '../../../hooks/useFeatureGate';
import { useRankDisplay } from '../../../hooks/useRankDisplay';
import { useSoloMatchChallenges } from '../../../hooks/useSoloMatchChallenges';
import { useSoloMatchmaking } from '../../../hooks/useSoloMatchmaking';
import { fetchFollowingProfilesForChallenge } from '../../../services/followService';
import { fetchSoloMatchType } from '../../../services/matchService';
import { fetchCountryRankPosition, type SoloRankPosition } from '../../../services/rank';
import { colors, spacing } from '../../../theme';
import { ChallengeFriendDrawer } from './ChallengeFriendDrawer';
import { IncomingChallengeCard } from './IncomingChallengeCard';
import { ProposedChallengeCard } from './ProposedChallengeCard';
import { SearchingForOpponentCard } from './SearchingForOpponentCard';
import { SoloMatchActions } from './SoloMatchActions';
import { SoloMatchFormatCard } from './SoloMatchFormatCard';
import { SoloProfileCard } from './SoloProfileCard';

type SoloMatchTabProps = {
  onViewActiveMatch?: () => void;
};

const DEFAULT_FORMAT: TeamMatchFormat = MOCK_SOLO_MATCHMAKING.matchFormat;

export function SoloMatchTab({ onViewActiveMatch }: SoloMatchTabProps) {
  const soloConfig = MOCK_SOLO_MATCHMAKING;
  const { gameState, session } = useAuth();
  const { profileRank, seasonRecord } = useRankDisplay();
  const [countryRankPosition, setCountryRankPosition] = useState<SoloRankPosition | null>(null);
  const countryCode = gameState?.profile.country_code ?? null;
  const { match: activeMatch, refresh: refreshActiveMatch } = useActiveSoloMatch();
  const {
    isSearching,
    actionLoading: matchmakingActionLoading,
    findMatch,
    cancelSearch,
    hasActiveMatch,
    refresh: refreshMatchmaking,
  } = useSoloMatchmaking();
  const {
    status: challengeStatus,
    actionLoading: challengeActionLoading,
    sendChallenge,
    acceptChallenge,
    declineChallenge,
    cancelChallenge,
    hasSentChallenge,
    hasIncomingChallenge,
    refresh: refreshChallenges,
  } = useSoloMatchChallenges();
  const rankedQueueGate = useFeatureGate('ranked_solo_queue');
  const challengeGate = useFeatureGate('send_friend_challenge');
  const [matchFormat, setMatchFormat] = useState<TeamMatchFormat>(DEFAULT_FORMAT);
  const [challengeDrawerVisible, setChallengeDrawerVisible] = useState(false);
  const [challengeFriends, setChallengeFriends] = useState<ChallengeFriend[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const matchType = await fetchSoloMatchType();
        if (!matchType) {
          return;
        }

        setMatchFormat({
          title: matchType.display_name,
          durationLabel: matchType.duration_label,
          winCondition: matchType.win_condition,
          overview: matchType.overview,
          scoringDetails: matchType.scoring_details,
        });
      } catch {
        // Keep default format when offline.
      }
    })();
  }, []);

  useEffect(() => {
    if (hasActiveMatch) {
      void refreshActiveMatch();
    }
  }, [hasActiveMatch, refreshActiveMatch]);

  useEffect(() => {
    const rating = profileRank.competitiveRating;
    if (rating == null || !countryCode) {
      setCountryRankPosition(null);
      return;
    }

    let cancelled = false;

    fetchCountryRankPosition(rating, countryCode)
      .then((position) => {
        if (!cancelled) setCountryRankPosition(position);
      })
      .catch((error) => {
        console.warn('Failed to load country rank position', error);
        if (!cancelled) setCountryRankPosition(null);
      });

    return () => {
      cancelled = true;
    };
  }, [profileRank.competitiveRating, countryCode]);

  async function loadChallengeFriends() {
    const userId = session?.user?.id;
    if (!userId) {
      setChallengeFriends([]);
      return;
    }

    try {
      const profiles = await fetchFollowingProfilesForChallenge(userId);
      setChallengeFriends(
        profiles.map((profile) => ({
          id: profile.id,
          name: profile.displayName,
          level: profile.level,
          avatarUrl: profile.avatarUrl,
        })),
      );
    } catch {
      setChallengeFriends([]);
    }
  }

  async function handleOpenChallengeDrawer() {
    setSelectedFriendId(null);
    setChallengeDrawerVisible(true);
    await loadChallengeFriends();
  }

  async function handleSendChallenge() {
    if (!selectedFriendId) {
      return;
    }

    await sendChallenge(selectedFriendId);
    setChallengeDrawerVisible(false);
    setSelectedFriendId(null);
  }

  async function handleFindMatch() {
    await findMatch();
    await refreshMatchmaking();
    await refreshActiveMatch();
    await refreshChallenges();
  }

  async function handleCancelSearch() {
    await cancelSearch();
  }

  async function handleViewActiveMatch() {
    await refreshActiveMatch();
    onViewActiveMatch?.();
  }

  async function handleAcceptChallenge(challengeId: string) {
    await acceptChallenge(challengeId);
    await refreshActiveMatch();
    await refreshMatchmaking();
    onViewActiveMatch?.();
  }

  const actionLoading = matchmakingActionLoading || challengeActionLoading;
  const actionStatus = isSearching ? 'searching' : hasSentChallenge ? 'challenge_pending' : 'idle';
  const showActiveMatchCard = Boolean(activeMatch) || hasActiveMatch;
  const actionsDisabled =
    actionLoading || hasActiveMatch || hasSentChallenge || hasIncomingChallenge || isSearching;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {challengeStatus.received.map((challenge) => (
          <IncomingChallengeCard
            key={challenge.id}
            acceptLockedLabel={challengeGate.lockedLabel}
            challenge={challenge}
            disabled={actionLoading || hasActiveMatch}
            onAccept={() => {
              void handleAcceptChallenge(challenge.id);
            }}
            onDecline={() => {
              void declineChallenge(challenge.id);
            }}
          />
        ))}

        {challengeStatus.sent ? (
          <ProposedChallengeCard
            challenge={challengeStatus.sent}
            onCancel={() => {
              void cancelChallenge(challengeStatus.sent!.id);
            }}
          />
        ) : null}

        {showActiveMatchCard ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void handleViewActiveMatch();
            }}
            style={({ pressed }) => [styles.activeMatchCard, pressed && styles.pressed]}
          >
            <Text style={styles.activeMatchEyebrow}>ACTIVE MATCH</Text>
            <Text style={styles.activeMatchTitle}>
              {activeMatch
                ? `View 1v1 match vs ${activeMatch.awayRunner.name}`
                : 'View your active 1v1 match'}
            </Text>
          </Pressable>
        ) : null}

        <SoloProfileCard
          avatarUrl={gameState?.profile.avatar_url ?? soloConfig.avatarUrl}
          competitiveRating={profileRank.competitiveRating}
          rankTierId={profileRank.tierId}
          regionCode={countryCode}
          soloRankPosition={countryRankPosition}
          wins={seasonRecord.wins}
        />

        {isSearching ? (
          <SearchingForOpponentCard onCancel={() => void handleCancelSearch()} />
        ) : (
          <SoloMatchFormatCard format={matchFormat} />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <SoloMatchActions
        challengeLockedLabel={challengeGate.lockedLabel}
        disabled={actionsDisabled}
        findLockedLabel={rankedQueueGate.lockedLabel}
        onChallengeFriend={() => {
          void handleOpenChallengeDrawer();
        }}
        onFindMatch={() => {
          void handleFindMatch();
        }}
        status={actionStatus}
      />

      <ChallengeFriendDrawer
        friends={challengeFriends}
        onClose={() => {
          setChallengeDrawerVisible(false);
          setSelectedFriendId(null);
        }}
        onSelectFriend={setSelectedFriendId}
        onSendInvite={() => {
          void handleSendChallenge();
        }}
        selectedFriendId={selectedFriendId}
        visible={challengeDrawerVisible}
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
    height: spacing.md,
  },
  activeMatchCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accentLime,
    padding: spacing.md,
    gap: 4,
  },
  activeMatchEyebrow: {
    color: colors.accentLime,
    fontSize: 9,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.8,
  },
  activeMatchTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
