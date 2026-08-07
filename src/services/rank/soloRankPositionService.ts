import { supabase } from '../supabase';

export type SoloRankPosition = {
  /** 1-based placement by `player_rank.competitive_rating`, highest rating first. */
  position: number;
  /** Total ranked players, for the "#12 of 480" line. */
  totalPlayers: number;
};

/**
 * The viewer's placement on the solo leaderboard.
 *
 * Counted server-side (`head: true` + exact count) rather than by pulling the
 * board down — `listTopPlayers` is capped at 50 rows and can't answer this for
 * anyone outside the top of the table.
 *
 * This is a **global** placement. The Me tab pairs it with the device-locale
 * flag (see `deviceRegion.ts`); scoping it per country needs a real
 * `profiles.country_code` column first.
 */
export async function fetchSoloRankPosition(rating: number): Promise<SoloRankPosition | null> {
  if (!supabase) return null;

  const [{ count: ahead, error: aheadError }, { count: total, error: totalError }] = await Promise.all([
    supabase
      .from('player_rank')
      .select('user_id', { count: 'exact', head: true })
      .gt('competitive_rating', rating),
    supabase.from('player_rank').select('user_id', { count: 'exact', head: true }),
  ]);

  if (aheadError) throw aheadError;
  if (totalError) throw totalError;

  return {
    position: (ahead ?? 0) + 1,
    totalPlayers: total ?? 0,
  };
}
