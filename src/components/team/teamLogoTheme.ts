import type { TeamLogoAccent } from '../../mock';
import { colors } from '../../theme';

const LOGO_ACCENT_COLORS: Record<TeamLogoAccent, string> = {
  lime: colors.accentLime,
  purple: colors.accentPurple,
  gold: colors.accentGold,
  silver: '#B8C0CC',
  cyan: '#4DEEFF',
  blue: '#4DA6FF',
};

export function getTeamLogoAccentColor(accent: TeamLogoAccent): string {
  return LOGO_ACCENT_COLORS[accent];
}
