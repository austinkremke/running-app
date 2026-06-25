import type { ProfileExperience } from '../mock';

/** XP required to advance from `level` to `level + 1`. Tune in milestone 03. */
export function xpForLevelUp(level: number): number {
  return Math.round(120 * 1.09 ** level);
}

export function cumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let current = 1; current < level; current += 1) {
    total += xpForLevelUp(current);
  }
  return total;
}

export function levelFromTotalXp(totalXp: number): number {
  let level = 1;

  while (level < 98) {
    const nextThreshold = cumulativeXpForLevel(level + 1);
    if (totalXp < nextThreshold) {
      break;
    }
    level += 1;
  }

  return level;
}

export function experienceFromTotalXp(totalXp: number): ProfileExperience {
  const level = levelFromTotalXp(totalXp);
  const currentLevelFloor = cumulativeXpForLevel(level);
  const nextLevel = Math.min(level + 1, 99);
  const nextLevelXp = cumulativeXpForLevel(nextLevel);

  return {
    currentXp: Math.max(0, totalXp - currentLevelFloor),
    nextLevelXp: Math.max(1, nextLevelXp - currentLevelFloor),
    nextLevel,
  };
}
