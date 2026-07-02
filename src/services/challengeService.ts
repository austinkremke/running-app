import type { ChallengeFriend, ProposedChallenge } from '../mock';
import { levelFromTotalXp } from './levelCurve';
import { supabase } from './supabase';

export type ReceivedSoloChallenge = {
  id: string;
  receivedAt: string;
  challenger: ChallengeFriend;
};

export type SoloChallengeStatus = {
  sent: ProposedChallenge | null;
  received: ReceivedSoloChallenge[];
};

function parseChallengeFriend(payload: Record<string, unknown>, prefix: 'challenged' | 'challenger'): ChallengeFriend | null {
  const idKey = `${prefix}_user_id`;
  const id = payload[idKey];
  if (typeof id !== 'string') {
    return null;
  }

  const nameKey = `${prefix}_name`;
  const avatarKey = `${prefix}_avatar_url`;
  const xpKey = `${prefix}_total_xp`;

  return {
    id,
    name: typeof payload[nameKey] === 'string' ? payload[nameKey] : prefix === 'challenged' ? 'Friend' : 'Runner',
    avatarUrl: typeof payload[avatarKey] === 'string' ? payload[avatarKey] : undefined,
    level: levelFromTotalXp(typeof payload[xpKey] === 'number' ? payload[xpKey] : 0),
  };
}

function parseSoloChallengeStatus(payload: Record<string, unknown>): SoloChallengeStatus {
  const sentPayload =
    payload.sent && typeof payload.sent === 'object' ? (payload.sent as Record<string, unknown>) : null;
  const receivedPayload = Array.isArray(payload.received) ? payload.received : [];

  const sentFriend = sentPayload ? parseChallengeFriend(sentPayload, 'challenged') : null;
  const sentChallengeId = sentPayload?.challenge_id;
  const sentCreatedAt = sentPayload?.created_at;

  return {
    sent:
      sentFriend && typeof sentChallengeId === 'string'
        ? {
            friend: sentFriend,
            sentAt: typeof sentCreatedAt === 'string' ? sentCreatedAt : new Date().toISOString(),
            id: sentChallengeId,
          }
        : null,
    received: receivedPayload
      .map((entry) => {
        if (!entry || typeof entry !== 'object') {
          return null;
        }

        const row = entry as Record<string, unknown>;
        const challenger = parseChallengeFriend(row, 'challenger');
        const challengeId = row.challenge_id;
        const createdAt = row.created_at;

        if (!challenger || typeof challengeId !== 'string') {
          return null;
        }

        return {
          id: challengeId,
          receivedAt: typeof createdAt === 'string' ? createdAt : new Date().toISOString(),
          challenger,
        };
      })
      .filter((entry): entry is ReceivedSoloChallenge => entry !== null),
  };
}

export async function getSoloChallengeStatus(): Promise<SoloChallengeStatus> {
  if (!supabase) {
    return { sent: null, received: [] };
  }

  const { data, error } = await supabase.rpc('get_solo_match_challenge_status');
  if (error) {
    throw error;
  }

  return parseSoloChallengeStatus((data ?? {}) as Record<string, unknown>);
}

export async function sendSoloChallenge(
  challengedUserId: string,
  matchTypeId = 'solo_distance',
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('send_solo_match_challenge', {
    p_challenged_user_id: challengedUserId,
    p_match_type_id: matchTypeId,
  });

  if (error) {
    throw error;
  }
}

export async function acceptSoloChallenge(challengeId: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.rpc('accept_solo_match_challenge', {
    p_challenge_id: challengeId,
  });

  if (error) {
    throw error;
  }

  const payload = (data ?? {}) as { match_id?: string };
  if (typeof payload.match_id !== 'string') {
    throw new Error('Challenge accepted but no match was created.');
  }

  return payload.match_id;
}

export async function declineSoloChallenge(challengeId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('decline_solo_match_challenge', {
    p_challenge_id: challengeId,
  });

  if (error) {
    throw error;
  }
}

export async function cancelSoloChallenge(challengeId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('cancel_solo_match_challenge', {
    p_challenge_id: challengeId,
  });

  if (error) {
    throw error;
  }
}

export async function hasIncomingSoloChallenge(userId: string): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase.rpc('has_incoming_solo_match_challenge', {
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }

  return data === true;
}
