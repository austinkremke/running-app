import { supabase } from '../supabase';
import { fetchRankTiers } from './rankService';
import { mapRankTierRow, tierFromRating } from './tierFromRating';

export type SoloRatingHistoryEntry = {
  matchId: string;
  endedAt: string;
  result: 'win' | 'loss' | 'tie';
  myPoints: number;
  opponentPoints: number;
  opponentId: string | null;
  opponentName: string;
  opponentAvatarUrl: string | null;
  /** Undefined if the opponent has no `player_rank` row (shouldn't happen for a real match, but avatars fall back gracefully). */
  opponentRankTierId?: string;
  ratingBefore: number;
  ratingAfter: number;
  ratingDelta: number;
};

/** Chronological (newest first) solo ranked match history with the Elo rating snapshot
 * at that point in time — powers the Competitive History graph. Matches finalized
 * before the rating-snapshot columns existed are excluded server-side (no history to show). */
export async function fetchSoloRatingHistory(userId: string, limit = 50): Promise<SoloRatingHistoryEntry[]> {
  if (!supabase) return [];

  const { data, error } = await supabase.rpc('get_solo_rating_history', {
    p_user_id: userId,
    p_limit: limit,
  });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const opponentIds = [...new Set(data.map((row) => row.opponent_id).filter((id): id is string => id != null))];

  const [tierRows, { data: opponentRanks, error: ranksError }] = await Promise.all([
    fetchRankTiers().catch(() => []),
    opponentIds.length > 0
      ? supabase.from('player_rank').select('user_id, competitive_rating').in('user_id', opponentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (ranksError) throw ranksError;

  const tiers = tierRows.map(mapRankTierRow);
  const rankTierIdByOpponent = new Map(
    (opponentRanks ?? []).map((row) => [row.user_id, tierFromRating(row.competitive_rating, tiers).id]),
  );

  return data.map((row) => ({
    matchId: row.match_id,
    endedAt: row.ended_at,
    result: row.result as 'win' | 'loss' | 'tie',
    myPoints: Number(row.my_points),
    opponentPoints: Number(row.opponent_points),
    opponentId: row.opponent_id,
    opponentName: row.opponent_name ?? 'Opponent',
    opponentAvatarUrl: row.opponent_avatar_url,
    opponentRankTierId: row.opponent_id ? rankTierIdByOpponent.get(row.opponent_id) : undefined,
    ratingBefore: row.rating_before,
    ratingAfter: row.rating_after,
    ratingDelta: row.rating_delta,
  }));
}
