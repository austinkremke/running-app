import AsyncStorage from '@react-native-async-storage/async-storage';

const SEEN_PREFIX = 'team-match-result-seen:';

function seenKey(matchId: string) {
  return `${SEEN_PREFIX}${matchId}`;
}

export async function hasSeenTeamMatchResult(matchId: string): Promise<boolean> {
  const value = await AsyncStorage.getItem(seenKey(matchId));
  return value === '1';
}

export async function markTeamMatchResultSeen(matchId: string): Promise<void> {
  await AsyncStorage.setItem(seenKey(matchId), '1');
}
