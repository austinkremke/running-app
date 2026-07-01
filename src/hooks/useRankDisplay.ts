import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../context';
import { MOCK_PROFILE } from '../mock';
import type { SoloSeasonRecord } from '../mock';
import { buildProfileRank, buildRankDisplay, fetchRankTiers } from '../services/rank';
import type { RankDisplay } from '../types/rank';
import type { RankTierRow } from '../types/rank';

export function useRankDisplay(): {
  rankDisplay: RankDisplay | null;
  profileRank: typeof MOCK_PROFILE.rank;
  seasonRecord: SoloSeasonRecord;
  loading: boolean;
} {
  const { gameState } = useAuth();
  const [tiers, setTiers] = useState<RankTierRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchRankTiers()
      .then((nextTiers) => {
        if (!cancelled) {
          setTiers(nextTiers);
        }
      })
      .catch((error) => {
        console.warn('Failed to load rank tiers', error);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    const seasonRecord: SoloSeasonRecord = {
      wins: gameState?.rank.season_wins ?? 0,
      losses: gameState?.rank.season_losses ?? 0,
      bestStreak: 0,
    };

    if (!gameState?.rank) {
      return {
        rankDisplay: null,
        profileRank: MOCK_PROFILE.rank,
        seasonRecord,
        loading,
      };
    }

    if (tiers.length === 0) {
      return {
        rankDisplay: null,
        profileRank: {
          title: 'RUNNER',
          subtitle: `${gameState.rank.competitive_rating.toLocaleString()} rating`,
          icon: 'shield-outline',
          competitiveRating: gameState.rank.competitive_rating,
        },
        seasonRecord,
        loading,
      };
    }

    const rankDisplay = buildRankDisplay(gameState.rank, tiers);
    const profileRank = buildProfileRank(gameState.rank, tiers);

    return {
      rankDisplay,
      profileRank,
      seasonRecord,
      loading,
    };
  }, [gameState?.rank, loading, tiers]);
}
