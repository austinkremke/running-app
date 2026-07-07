type TeamMenuListener = () => void;

let menuListener: TeamMenuListener | null = null;

export function registerTeamMenuListener(listener: TeamMenuListener | null): void {
  menuListener = listener;
}

export function openTeamMenu(): void {
  menuListener?.();
}
