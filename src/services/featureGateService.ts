import type { Tables } from '../types/database';
import { supabase } from './supabase';

// Stable ids from the feature_gates catalog (seeded in 20250702000001_feature_gates.sql).
// Thresholds live in the DB, not here — see milestones/06 Phase 4.
export type FeatureGateId =
  | 'feed_comments'
  | 'send_friend_challenge'
  | 'ranked_solo_queue'
  | 'create_team';

export type FeatureGateRow = Tables<'feature_gates'>;

let cachedGates: FeatureGateRow[] | null = null;

export async function fetchFeatureGates(force = false): Promise<FeatureGateRow[]> {
  if (!force && cachedGates) {
    return cachedGates;
  }

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('feature_gates')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  cachedGates = data ?? [];
  return cachedGates;
}

/** Min level for an active gate, or null when the feature is ungated (unknown/inactive ids stay open). */
export function minLevelForFeature(
  featureId: FeatureGateId,
  gates: FeatureGateRow[],
): number | null {
  const gate = gates.find((row) => row.feature_id === featureId && row.is_active);
  return gate ? gate.min_level : null;
}
