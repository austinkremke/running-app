type SoloMatchMenuListener = () => void;

let menuListener: SoloMatchMenuListener | null = null;

export function registerSoloMatchMenuListener(listener: SoloMatchMenuListener | null): void {
  menuListener = listener;
}

export function openSoloMatchMenu(): void {
  menuListener?.();
}
