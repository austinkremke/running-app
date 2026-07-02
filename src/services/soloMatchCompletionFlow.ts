import {
  fetchMySoloMatchCompletions,
  finalizeDueSoloMatches,
} from './matchmakingService';
import { drainStagedSoloMatchCompletions } from './soloMatchCompletionBus';
import { hasSeenSoloMatchResult } from '../storage/soloMatchResultStorage';
import type { SoloMatchCompletion } from '../types/soloMatchCompletion';

type CompletionFlowState = {
  userId: string;
  promise: Promise<SoloMatchCompletion[]>;
};

let activeFlow: CompletionFlowState | null = null;

function mergeCompletions(completions: SoloMatchCompletion[]): SoloMatchCompletion[] {
  const byMatchId = new Map<string, SoloMatchCompletion>();

  for (const completion of completions) {
    byMatchId.set(completion.matchId, completion);
  }

  return [...byMatchId.values()];
}

export async function loadPendingSoloMatchCompletions(): Promise<{
  unseen: SoloMatchCompletion[];
  finalized: SoloMatchCompletion[];
}> {
  const staged = drainStagedSoloMatchCompletions();

  let freshCompletions: SoloMatchCompletion[] = [];
  try {
    freshCompletions = await finalizeDueSoloMatches();
  } catch (error) {
    console.warn('Could not finalize due solo matches', error);
  }

  let storedCompletions: SoloMatchCompletion[] = [];
  try {
    storedCompletions = await fetchMySoloMatchCompletions();
  } catch (error) {
    console.warn('Could not load stored solo match completions', error);
  }

  const merged = mergeCompletions([...staged, ...storedCompletions, ...freshCompletions]);
  const unseen: SoloMatchCompletion[] = [];

  for (const completion of merged) {
    const seen = await hasSeenSoloMatchResult(completion.matchId);
    if (!seen) {
      unseen.push(completion);
    }
  }

  return { unseen, finalized: freshCompletions };
}

export async function runSoloMatchCompletionFlow(
  userId: string,
  showSoloMatchCompletion: (completion: SoloMatchCompletion) => void,
  refreshGameState: () => Promise<void>,
): Promise<SoloMatchCompletion[]> {
  if (activeFlow?.userId === userId) {
    return activeFlow.promise;
  }

  const promise = (async () => {
    const { unseen, finalized } = await loadPendingSoloMatchCompletions();

    if (unseen.length > 0) {
      for (const completion of unseen) {
        showSoloMatchCompletion(completion);
      }
    }

    if (unseen.length > 0 || finalized.length > 0) {
      try {
        await refreshGameState();
      } catch (error) {
        console.warn('Could not refresh game state after solo match completion', error);
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
