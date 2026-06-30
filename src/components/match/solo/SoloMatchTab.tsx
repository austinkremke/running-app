import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MOCK_CHALLENGE_FRIENDS, MOCK_SOLO_MATCHMAKING } from '../../../mock';
import type { ProposedChallenge } from '../../../mock';
import { useAuth, usePlayerProgress } from '../../../context';
import { useRankDisplay } from '../../../hooks/useRankDisplay';
import { colors, spacing } from '../../../theme';
import { ChallengeFriendDrawer } from './ChallengeFriendDrawer';
import { ProposedChallengeCard } from './ProposedChallengeCard';
import { SearchingForOpponentCard } from './SearchingForOpponentCard';
import { SoloMatchActions } from './SoloMatchActions';
import { SoloMatchFormatCard } from './SoloMatchFormatCard';
import { SoloProfileCard } from './SoloProfileCard';
import { SoloSeasonRecordCard } from './SoloSeasonRecordCard';

type SoloMatchTabProps = {
  onViewActiveMatch?: () => void;
};

export function SoloMatchTab({ onViewActiveMatch }: SoloMatchTabProps) {
  const soloConfig = MOCK_SOLO_MATCHMAKING;
  const { gameState } = useAuth();
  const { level } = usePlayerProgress();
  const { profileRank, seasonRecord } = useRankDisplay();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [proposedChallenge, setProposedChallenge] = useState<ProposedChallenge | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  function handleOpenDrawer() {
    setSelectedFriendId(null);
    setDrawerVisible(true);
  }

  function handleCloseDrawer() {
    setDrawerVisible(false);
    setSelectedFriendId(null);
  }

  function handleSendInvite() {
    const friend = MOCK_CHALLENGE_FRIENDS.find((item) => item.id === selectedFriendId);
    if (!friend) {
      return;
    }

    setProposedChallenge({
      friend,
      sentAt: new Date().toISOString(),
    });
    setSelectedFriendId(null);
  }

  function handleCancelChallenge() {
    setProposedChallenge(null);
  }

  function handleFindMatch() {
    setIsSearching(true);
  }

  function handleCancelSearch() {
    setIsSearching(false);
  }

  const actionStatus = proposedChallenge
    ? 'challenge_pending'
    : isSearching
      ? 'searching'
      : 'idle';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onViewActiveMatch}
          style={({ pressed }) => [styles.activeMatchCard, pressed && styles.pressed]}
        >
          <Text style={styles.activeMatchEyebrow}>ACTIVE MATCH</Text>
          <Text style={styles.activeMatchTitle}>View 1v1 match vs Jordan</Text>
        </Pressable>

        <SoloProfileCard
          avatarUrl={gameState?.profile.avatar_url ?? soloConfig.avatarUrl}
          level={level}
          name={gameState?.profile.display_name ?? soloConfig.name}
          rankIcon={profileRank.icon}
          rankTitle={profileRank.title}
        />
        {isSearching ? (
          <SearchingForOpponentCard onCancel={handleCancelSearch} />
        ) : (
          <SoloMatchFormatCard format={soloConfig.matchFormat} />
        )}

        <SoloSeasonRecordCard record={seasonRecord} />

        {proposedChallenge ? (
          <ProposedChallengeCard challenge={proposedChallenge} onCancel={handleCancelChallenge} />
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <SoloMatchActions
        onChallengeFriend={handleOpenDrawer}
        onFindMatch={handleFindMatch}
        status={actionStatus}
      />

      <ChallengeFriendDrawer
        friends={MOCK_CHALLENGE_FRIENDS}
        onClose={handleCloseDrawer}
        onSelectFriend={setSelectedFriendId}
        onSendInvite={handleSendInvite}
        selectedFriendId={selectedFriendId}
        visible={drawerVisible}
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
