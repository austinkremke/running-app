import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type RankBadgeProps = {
  icon: IoniconsName;
  size?: number;
};

export function RankBadge({ icon, size = 38 }: RankBadgeProps) {
  return (
    <View style={[styles.shield, { width: size, height: size * 1.08 }]}>
      <Ionicons color={colors.textPrimary} name={icon} size={size * 0.48} />
    </View>
  );
}

const styles = StyleSheet.create({
  shield: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentPurple,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
});
