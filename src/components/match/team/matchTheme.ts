import { StyleSheet } from 'react-native';

import type { TeamMatchAccent, TeamMatchChallengeStats } from '../../../mock';
import { getTeamLogoAccentColor } from '../../team/teamLogoTheme';

export function getTeamMatchAccentColor(accent: TeamMatchAccent): string {
  return getTeamLogoAccentColor(accent);
}

export function getTeamMatchAccentTint(accent: TeamMatchAccent): string {
  return accent === 'lime' ? 'rgba(215, 255, 47, 0.1)' : 'rgba(155, 92, 255, 0.12)';
}

export function formatMatchPoints(value: number): string {
  return value.toLocaleString('en-US');
}

function formatChallengeDistanceMiles(distanceMiles: number): string {
  const distance =
    distanceMiles % 1 === 0 ? String(distanceMiles) : distanceMiles.toFixed(1);

  return `${distance} mi`;
}

export function formatChallengeDistance(stats: TeamMatchChallengeStats): string {
  return formatChallengeDistanceMiles(stats.distanceMiles);
}

export function formatChallengePace(stats: TeamMatchChallengeStats): string {
  return `${stats.pacePerMile} min/mi`;
}

export const TEAM_MATCH_AVATAR_BORDER_WIDTH = StyleSheet.hairlineWidth;
export const TEAM_MATCH_LEVEL_BADGE_STROKE_WIDTH = StyleSheet.hairlineWidth;
