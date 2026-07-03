import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { TeamLogoAccent } from '../../mock';
import { colors } from '../../theme';
import { RankBorderAvatar } from './RankBorderAvatar';
import { rankBorderSourceForTier } from './rankAvatarBorderTheme';
import { getTeamLogoAccentColor } from './teamLogoTheme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type TeamAvatarProps = {
  icon: string;
  accent: TeamLogoAccent;
  size: number;
  rankTierId?: string | null;
};

/** Circular team badge (icon on accent color) with the same rank-tier border ring as user avatars. */
export function TeamAvatar({ icon, accent, size, rankTierId }: TeamAvatarProps) {
  const hasRankBorder = rankBorderSourceForTier(rankTierId) != null;
  const accentColor = getTeamLogoAccentColor(accent);

  const iconCircle = (
    <View style={[styles.iconCircle, { backgroundColor: accentColor }]}>
      <Ionicons color="#0A0A0A" name={icon as IoniconsName} size={size * 0.42} />
    </View>
  );

  if (hasRankBorder) {
    return <RankBorderAvatar fallback={iconCircle} rankTierId={rankTierId} size={size} />;
  }

  return (
    <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={styles.inner}>{iconCircle}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 3,
    borderColor: colors.accentLime,
    padding: 2,
  },
  inner: {
    flex: 1,
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconCircle: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
