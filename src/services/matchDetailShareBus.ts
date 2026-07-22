type MatchDetailShareListener = () => void;

let listener: MatchDetailShareListener | null = null;

export function registerMatchDetailShareListener(next: MatchDetailShareListener | null): void {
  listener = next;
}

export function triggerMatchDetailShare(): void {
  listener?.();
}
