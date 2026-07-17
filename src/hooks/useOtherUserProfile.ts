import { useEffect, useState } from 'react';

import type { ProfileRank, SoloSeasonRecord } from '../mock';
import { levelFromTotalXp } from '../services/levelCurve';
import { fetchSoloBestWinStreak } from '../services/matchService';
import { fetchUserGameState, type UserGameState } from '../services/profileService';
import { buildProfileRank, fetchRankTiers } from '../services/rank';
import {
  fetchProfileOverallStats,
  type ProfileOverallStats,
} from '../services/profileStatsService';
import { fetchTeamNameById } from '../services/teamService';

export type OtherUserProfile = {
  name: string;
  avatarUrl?: string;
  teamName: string;
  level: number;
  rank: ProfileRank;
};

type OtherUserProfileState = {
  profile: OtherUserProfile | null;
  seasonRecord: SoloSeasonRecord;
  overallStats: ProfileOverallStats | null;
  loading: boolean;
};

const EMPTY_SEASON_RECORD: SoloSeasonRecord = { wins: 0, losses: 0, bestStreak: 0 };

/** Read-only profile data for a runner other than the viewer — no achievements/XP, unlike useAuth's own gameState. */
export function useOtherUserProfile(userId: string | null): OtherUserProfileState {
  const [state, setState] = useState<OtherUserProfileState>({
    profile: null,
    seasonRecord: EMPTY_SEASON_RECORD,
    overallStats: null,
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setState({ profile: null, seasonRecord: EMPTY_SEASON_RECORD, overallStats: null, loading: false });
      return;
    }

    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true }));

    async function load() {
      const [gameState, tiers, overallStats, bestWinStreak] = await Promise.all([
        fetchUserGameState(userId as string),
        fetchRankTiers(),
        fetchProfileOverallStats(userId as string).catch((error) => {
          console.warn('Failed to load profile overall stats', error);
          return null;
        }),
        fetchSoloBestWinStreak(userId as string).catch((error) => {
          console.warn('Failed to load best win streak', error);
          return 0;
        }),
      ]);

      if (cancelled) return;

      if (!gameState) {
        setState({ profile: null, seasonRecord: EMPTY_SEASON_RECORD, overallStats: null, loading: false });
        return;
      }

      const teamName = gameState.profile.team_id
        ? ((await fetchTeamNameById(gameState.profile.team_id).catch(() => null)) ?? '')
        : '';
      if (cancelled) return;

      const profile: OtherUserProfile = {
        name: gameState.profile.display_name,
        avatarUrl: gameState.profile.avatar_url ?? undefined,
        teamName,
        level: levelFromTotalXp(gameState.progress.total_xp),
        rank: buildProfileRank(gameState.rank, tiers),
      };

      const seasonRecord: SoloSeasonRecord = {
        wins: gameState.rank.season_wins,
        losses: gameState.rank.season_losses,
        bestStreak: bestWinStreak,
      };

      setState({ profile, seasonRecord, overallStats, loading: false });
    }

    load().catch((error) => {
      console.warn('Failed to load user profile', error);
      if (!cancelled) {
        setState({ profile: null, seasonRecord: EMPTY_SEASON_RECORD, overallStats: null, loading: false });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return state;
}

export type { UserGameState };
