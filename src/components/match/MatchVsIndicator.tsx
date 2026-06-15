import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../../theme';

type MatchVsIndicatorProps = {
  variant?: 'diamond' | 'plain';
  style?: StyleProp<ViewStyle>;
};

export function MatchVsIndicator({ variant = 'plain', style }: MatchVsIndicatorProps) {
  if (variant === 'diamond') {
    return (
      <View style={[styles.wrap, style]}>
        <View style={styles.diamondBadge}>
          <Text style={[styles.vsText, styles.vsTextDiamond]}>VS</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <Text style={[styles.vsText, styles.vsTextPlain]}>VS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  diamondBadge: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    transform: [{ rotate: '45deg' }],
  },
  vsText: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  vsTextPlain: {
    fontSize: 12,
    letterSpacing: 0.4,
  },
  vsTextDiamond: {
    fontSize: 10,
    transform: [{ rotate: '-45deg' }],
  },
});
