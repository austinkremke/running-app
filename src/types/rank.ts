import type { Tables } from './database';

export type RankTierRow = Tables<'rank_tiers'>;
export type PlayerRankRow = Tables<'player_rank'>;

export type ResolvedRankTier = {
  id: string;
  displayName: string;
  subtitle: string;
  icon: string;
  minRating: number;
};

export type RankDisplay = {
  title: string;
  subtitle: string;
  icon: string;
  competitiveRating: number;
  seasonWins: number;
  seasonLosses: number;
};
