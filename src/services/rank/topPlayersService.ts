import type { TopPlayerListing } from '../../mock';
import { supabase } from '../supabase';
import { fetchRankTiers } from './rankService';
import { mapRankTierRow, tierFromRating } from './tierFromRating';
import type { ResolvedRankTier } from '../../types/rank';

type TopPlayerRow = {
  user_id: string;
  competitive_rating: number;
  season_wins: number;
  season_losses: number;
  profiles: { display_name: string; avatar_url: string | null; country_code: string | null } | null;
};

function mapTopPlayerRow(row: TopPlayerRow, rank: number, tiers: ResolvedRankTier[]): TopPlayerListing {
  const rankTierId = tiers.length > 0 ? tierFromRating(row.competitive_rating, tiers).id : undefined;

  return {
    id: row.user_id,
    rank,
    rankTierId,
    name: row.profiles?.display_name ?? 'Runner',
    avatarUrl: row.profiles?.avatar_url ?? undefined,
    countryCode: row.profiles?.country_code ?? null,
    rating: row.competitive_rating,
    wins: row.season_wins,
    losses: row.season_losses,
  };
}

/** Ranks players by their solo competitive rating (`player_rank.competitive_rating`), highest first. */
export async function listTopPlayers(limit = 50): Promise<TopPlayerListing[]> {
  if (!supabase) return [];

  const [{ data, error }, tierRows] = await Promise.all([
    supabase
      .from('player_rank')
      .select('user_id, competitive_rating, season_wins, season_losses, profiles:user_id (display_name, avatar_url, country_code)')
      .order('competitive_rating', { ascending: false })
      .limit(limit),
    fetchRankTiers().catch(() => []),
  ]);

  if (error) throw error;

  const tiers = tierRows.map(mapRankTierRow);

  return ((data ?? []) as unknown as TopPlayerRow[]).map((row, index) =>
    mapTopPlayerRow(row, index + 1, tiers),
  );
}
