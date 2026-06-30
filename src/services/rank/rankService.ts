import type { ProfileRank } from '../../mock';
import type { PlayerRankRow, RankDisplay, RankTierRow } from '../../types/rank';
import { supabase } from '../supabase';
import { mapRankTierRow, tierFromRating } from './tierFromRating';
import { rankTierIconToIonicon } from './rankTierIcons';

let cachedTiers: RankTierRow[] | null = null;

export async function fetchRankTiers(force = false): Promise<RankTierRow[]> {
  if (!force && cachedTiers) {
    return cachedTiers;
  }

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('rank_tiers')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  cachedTiers = data ?? [];
  return cachedTiers;
}

export function buildRankDisplay(
  rank: PlayerRankRow,
  tiers: RankTierRow[],
): RankDisplay {
  const tier = tierFromRating(rank.competitive_rating, tiers.map(mapRankTierRow));

  return {
    title: tier.displayName.toUpperCase(),
    subtitle: `${rank.competitive_rating.toLocaleString()} rating`,
    icon: rankTierIconToIonicon(tier.icon),
    competitiveRating: rank.competitive_rating,
    seasonWins: rank.season_wins,
    seasonLosses: rank.season_losses,
  };
}

export function buildProfileRank(rank: PlayerRankRow, tiers: RankTierRow[]): ProfileRank {
  const display = buildRankDisplay(rank, tiers);
  return {
    title: display.title,
    subtitle: display.subtitle,
    icon: display.icon,
  };
}

export type EloMatchResult = {
  winner_user_id: string;
  loser_user_id: string;
  winner_rating: number;
  loser_rating: number;
  winner_delta: number;
  loser_delta: number;
};

export async function applyEloMatchResult(
  winnerUserId: string,
  loserUserId: string,
): Promise<EloMatchResult> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.rpc('apply_elo_match_result', {
    p_winner_user_id: winnerUserId,
    p_loser_user_id: loserUserId,
  });

  if (error) {
    throw error;
  }

  return data as EloMatchResult;
}
