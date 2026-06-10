import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme';

type TeamShieldLogoProps = {
  width?: number;
};

export function TeamShieldLogo({ width = 72 }: TeamShieldLogoProps) {
  return (
    <View style={[styles.shield, { width }]}>
      <Ionicons color={colors.textPrimary} name="paw" size={width * 0.36} />
    </View>
  );
}

const styles = StyleSheet.create({
  shield: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.accentLime,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
});
