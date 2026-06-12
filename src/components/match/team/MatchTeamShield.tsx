import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { TeamMatchAccent } from '../../../mock';
import { getTeamMatchAccentColor } from './matchTheme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type MatchTeamShieldProps = {
  accent: TeamMatchAccent;
  icon: IoniconsName;
  size?: number;
};

export function MatchTeamShield({ accent, icon, size = 52 }: MatchTeamShieldProps) {
  const borderColor = getTeamMatchAccentColor(accent);

  return (
    <View style={[styles.shield, { width: size, height: size * 1.08, borderColor }]}>
      <Ionicons color={borderColor} name={icon} size={size * 0.38} />
    </View>
  );
}

const styles = StyleSheet.create({
  shield: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
});
