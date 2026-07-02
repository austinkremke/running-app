import type { SoloMatchCompletion } from '../types/soloMatchCompletion';

type SoloMatchCompletionSyncListener = (completions: SoloMatchCompletion[]) => void;

const listeners = new Set<SoloMatchCompletionSyncListener>();
const pendingCompletions = new Map<string, SoloMatchCompletion>();

export function subscribeSoloMatchCompletionSync(
  listener: SoloMatchCompletionSyncListener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function stageSoloMatchCompletions(completions: SoloMatchCompletion[]): void {
  for (const completion of completions) {
    pendingCompletions.set(completion.matchId, completion);
  }
}

export function drainStagedSoloMatchCompletions(): SoloMatchCompletion[] {
  const completions = [...pendingCompletions.values()];
  pendingCompletions.clear();
  return completions;
}

export function notifySoloMatchCompletionSync(completions: SoloMatchCompletion[] = []): void {
  stageSoloMatchCompletions(completions);

  for (const listener of listeners) {
    listener(completions);
  }
}
