import { supabase } from '../supabase';

export type SoloRankPosition = {
  /** 1-based placement by `player_rank.competitive_rating`, highest rating first. */
  position: number;
  /** Total ranked players in the scope (global, or the given country), for a "#12 of 480" line. */
  totalPlayers: number;
};

type RankPositionRpcResult = {
  position: number;
  total_players: number;
};

async function fetchRankPosition(rating: number, countryCode?: string | null): Promise<SoloRankPosition | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('get_solo_rank_position', {
    p_rating: rating,
    p_country_code: countryCode ?? undefined,
  });

  if (error) throw error;
  if (!data) return null;

  const result = data as unknown as RankPositionRpcResult;

  return {
    position: result.position,
    totalPlayers: result.total_players,
  };
}

/**
 * The viewer's placement among solo players who share their stored
 * `profiles.country_code` — null if they haven't set one yet (there's
 * nothing to scope by, so callers should treat null the same as "unavailable").
 */
export async function fetchCountryRankPosition(
  rating: number,
  countryCode: string | null | undefined,
): Promise<SoloRankPosition | null> {
  if (!countryCode) return null;
  return fetchRankPosition(rating, countryCode);
}
