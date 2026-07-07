import type { TeamMatchCompletion } from '../types/teamMatchCompletion';

type TeamMatchCompletionSyncListener = (completions: TeamMatchCompletion[]) => void;

const listeners = new Set<TeamMatchCompletionSyncListener>();
const pendingCompletions = new Map<string, TeamMatchCompletion>();

export function subscribeTeamMatchCompletionSync(
  listener: TeamMatchCompletionSyncListener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function stageTeamMatchCompletions(completions: TeamMatchCompletion[]): void {
  for (const completion of completions) {
    pendingCompletions.set(completion.matchId, completion);
  }
}

export function drainStagedTeamMatchCompletions(): TeamMatchCompletion[] {
  const completions = [...pendingCompletions.values()];
  pendingCompletions.clear();
  return completions;
}

export function notifyTeamMatchCompletionSync(completions: TeamMatchCompletion[] = []): void {
  stageTeamMatchCompletions(completions);

  for (const listener of listeners) {
    listener(completions);
  }
}
