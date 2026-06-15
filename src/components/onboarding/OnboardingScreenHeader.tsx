import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, layout, spacing } from '../../theme';

type OnboardingScreenHeaderProps = {
  title?: string;
  onBack?: () => void;
};

export function OnboardingScreenHeader({ title, onBack }: OnboardingScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Ionicons color={colors.textPrimary} name="chevron-back" size={22} />
          </Pressable>
        ) : (
          <View style={styles.sideSpacer} />
        )}
      </View>

      {title ? <Text style={styles.title}>{title}</Text> : <View style={styles.titleSpacer} />}

      <View style={styles.side}>
        <View style={styles.sideSpacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  side: {
    width: layout.headerSideWidth,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideSpacer: {
    width: layout.headerSideWidth,
  },
  backButton: {
    width: layout.iconButtonSize,
    height: layout.iconButtonSize,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  titleSpacer: {
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
  },
});
