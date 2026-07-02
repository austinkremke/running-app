type MatchRefreshListener = () => void;

const listeners = new Set<MatchRefreshListener>();

export function subscribeMatchRefresh(listener: MatchRefreshListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyMatchRefresh(): void {
  for (const listener of listeners) {
    listener();
  }
}
