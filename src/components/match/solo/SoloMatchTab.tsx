import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { MOCK_CHALLENGE_FRIENDS, MOCK_SOLO_MATCHMAKING } from '../../../mock';
import type { ProposedChallenge } from '../../../mock';
import { colors, spacing } from '../../../theme';
import { ChallengeFriendDrawer } from './ChallengeFriendDrawer';
import { ProposedChallengeCard } from './ProposedChallengeCard';
import { SearchingForOpponentCard } from './SearchingForOpponentCard';
import { SoloMatchActions } from './SoloMatchActions';
import { SoloMatchFormatCard } from './SoloMatchFormatCard';
import { SoloProfileCard } from './SoloProfileCard';
import { SoloSeasonRecordCard } from './SoloSeasonRecordCard';

export function SoloMatchTab() {
  const soloConfig = MOCK_SOLO_MATCHMAKING;
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
        <SoloProfileCard
          avatarUrl={soloConfig.avatarUrl}
          level={soloConfig.level}
          name={soloConfig.name}
          rankIcon={soloConfig.rankIcon}
          rankTitle={soloConfig.rankTitle}
        />
        {isSearching ? (
          <SearchingForOpponentCard onCancel={handleCancelSearch} />
        ) : (
          <SoloMatchFormatCard format={soloConfig.matchFormat} />
        )}

        <SoloSeasonRecordCard record={soloConfig.seasonRecord} />

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
});
