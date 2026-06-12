import type { TopTeamShieldAccent } from '../../../mock';
import { colors } from '../../../theme';

const SHIELD_ACCENT_COLORS: Record<TopTeamShieldAccent, string> = {
  lime: colors.accentLime,
  purple: colors.accentPurple,
  gold: colors.accentGold,
  silver: '#B8C0CC',
  cyan: '#4DEEFF',
  blue: '#4DA6FF',
};

export function getTopTeamShieldAccentColor(accent: TopTeamShieldAccent): string {
  return SHIELD_ACCENT_COLORS[accent];
}
