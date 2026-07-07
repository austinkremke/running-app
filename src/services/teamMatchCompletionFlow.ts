import { fetchMyTeamMatchCompletions, finalizeDueTeamMatches } from './teamMatchmakingService';
import { drainStagedTeamMatchCompletions } from './teamMatchCompletionBus';
import { hasSeenTeamMatchResult } from '../storage/teamMatchResultStorage';
import type { TeamMatchCompletion } from '../types/teamMatchCompletion';

type CompletionFlowState = {
  userId: string;
  promise: Promise<TeamMatchCompletion[]>;
};

let activeFlow: CompletionFlowState | null = null;

function mergeCompletions(completions: TeamMatchCompletion[]): TeamMatchCompletion[] {
  const byMatchId = new Map<string, TeamMatchCompletion>();

  for (const completion of completions) {
    byMatchId.set(completion.matchId, completion);
  }

  return [...byMatchId.values()];
}

export async function loadPendingTeamMatchCompletions(): Promise<{
  unseen: TeamMatchCompletion[];
  finalized: TeamMatchCompletion[];
}> {
  const staged = drainStagedTeamMatchCompletions();

  let freshCompletions: TeamMatchCompletion[] = [];
  try {
    freshCompletions = await finalizeDueTeamMatches();
  } catch (error) {
    console.warn('Could not finalize due team matches', error);
  }

  let storedCompletions: TeamMatchCompletion[] = [];
  try {
    storedCompletions = await fetchMyTeamMatchCompletions();
  } catch (error) {
    console.warn('Could not load stored team match completions', error);
  }

  const merged = mergeCompletions([...staged, ...storedCompletions, ...freshCompletions]);
  const unseen: TeamMatchCompletion[] = [];

  for (const completion of merged) {
    const seen = await hasSeenTeamMatchResult(completion.matchId);
    if (!seen) {
      unseen.push(completion);
    }
  }

  return { unseen, finalized: freshCompletions };
}

export async function runTeamMatchCompletionFlow(
  userId: string,
  showTeamMatchCompletion: (completion: TeamMatchCompletion) => void,
): Promise<TeamMatchCompletion[]> {
  if (activeFlow?.userId === userId) {
    return activeFlow.promise;
  }

  const promise = (async () => {
    const { unseen } = await loadPendingTeamMatchCompletions();

    if (unseen.length > 0) {
      for (const completion of unseen) {
        showTeamMatchCompletion(completion);
      }
    }

    return unseen;
  })().finally(() => {
    if (activeFlow?.userId === userId) {
      activeFlow = null;
    }
  });

  activeFlow = { userId, promise };
  return promise;
}
