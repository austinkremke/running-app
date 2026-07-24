import { levelFromTotalXp } from './levelCurve';
import { rangeSinceDate } from './profileStatsService';
import { supabase } from './supabase';

export type WeeklyProgressSummary = {
  workoutsCompleted: number;
  xpGained: number;
  levelsGained: number;
};

/** Last-7-days snapshot for the Me tab's Progress header — replaces the rank
 * block when the Progress tab is active (rank only makes sense in Competitive). */
export async function fetchWeeklyProgressSummary(
  userId: string,
  currentTotalXp: number,
): Promise<WeeklyProgressSummary> {
  if (!supabase) {
    return { workoutsCompleted: 0, xpGained: 0, levelsGained: 0 };
  }

  const since = rangeSinceDate('week');

  const [{ count }, { data: ledgerRows, error: ledgerError }] = await Promise.all([
    supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('started_at', since!.toISOString()),
    supabase.from('xp_ledger').select('amount').eq('user_id', userId).gte('awarded_at', since!.toISOString()),
  ]);

  if (ledgerError) throw ledgerError;

  const xpGained = (ledgerRows ?? []).reduce((sum, row) => sum + row.amount, 0);
  const levelsGained = Math.max(0, levelFromTotalXp(currentTotalXp) - levelFromTotalXp(currentTotalXp - xpGained));

  return {
    workoutsCompleted: count ?? 0,
    xpGained,
    levelsGained,
  };
}
