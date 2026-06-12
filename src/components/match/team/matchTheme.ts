import type { TeamMatchAccent } from '../../../mock';
import { colors } from '../../../theme';

export function getTeamMatchAccentColor(accent: TeamMatchAccent): string {
  return accent === 'lime' ? colors.accentLime : colors.accentPurple;
}

export function getTeamMatchAccentTint(accent: TeamMatchAccent): string {
  return accent === 'lime' ? 'rgba(215, 255, 47, 0.1)' : 'rgba(155, 92, 255, 0.12)';
}

export function formatMatchPoints(value: number): string {
  return value.toLocaleString('en-US');
}

export const TEAM_MATCH_AVATAR_BORDER_WIDTH = 1;
