import type { Tables } from '../types/database';
import { supabase } from './supabase';

export type Profile = Tables<'profiles'>;
export type PlayerProgress = Tables<'player_progress'>;
export type PlayerRank = Tables<'player_rank'>;

export type UserGameState = {
  profile: Profile;
  progress: PlayerProgress;
  rank: PlayerRank;
};

const PROFILE_RETRY_MS = [200, 400, 600, 800, 1000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchProfileRow(userId: string): Promise<Profile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchUserGameState(userId: string): Promise<UserGameState | null> {
  if (!supabase) return null;

  for (let attempt = 0; attempt < PROFILE_RETRY_MS.length; attempt += 1) {
    const profile = await fetchProfileRow(userId);
    if (!profile) {
      await sleep(PROFILE_RETRY_MS[attempt] ?? 1000);
      continue;
    }

    const [{ data: progress, error: progressError }, { data: rank, error: rankError }] =
      await Promise.all([
        supabase.from('player_progress').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('player_rank').select('*').eq('user_id', userId).maybeSingle(),
      ]);

    if (progressError) throw progressError;
    if (rankError) throw rankError;
    if (!progress || !rank) {
      await sleep(PROFILE_RETRY_MS[attempt] ?? 1000);
      continue;
    }

    return { profile, progress, rank };
  }

  return null;
}

export async function markOnboardingCompleted(userId: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
}
