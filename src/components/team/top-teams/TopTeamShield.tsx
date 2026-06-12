import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { TopTeamShieldAccent } from '../../../mock';
import { getTopTeamShieldAccentColor } from './topTeamsTheme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type TopTeamShieldProps = {
  accent: TopTeamShieldAccent;
  icon: IoniconsName;
  size?: number;
};

export function TopTeamShield({ accent, icon, size = 52 }: TopTeamShieldProps) {
  const borderColor = getTopTeamShieldAccentColor(accent);
  const height = size * 1.28;

  return (
    <View style={[styles.shield, { width: size, height, borderColor }]}>
      <Ionicons color={borderColor} name={icon} size={size * 0.4} />
    </View>
  );
}

const styles = StyleSheet.create({
  shield: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
});
