import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, spacing, typography } from '../../theme';

type AppHeaderProps = {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
  /** Divider below the header row. Off by default to match the feed screenshot. */
  showBorder?: boolean;
};

export function AppHeader({ title, left, right, showBorder = false }: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        <View style={styles.side}>{left ?? <View style={styles.sideSpacer} />}</View>

        <Text numberOfLines={1} pointerEvents="none" style={styles.title}>
          {title}
        </Text>

        <View style={[styles.side, styles.sideRight]}>
          {right ?? <View style={styles.sideSpacer} />}
        </View>
      </View>

      {showBorder ? <View style={styles.border} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    backgroundColor: colors.background,
  },
  container: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  border: {
    height: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  side: {
    minWidth: layout.headerSideWidth,
    flexShrink: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 1,
  },
  sideRight: {
    alignItems: 'flex-end',
    marginLeft: 'auto',
  },
  sideSpacer: {
    width: layout.iconButtonSize,
    height: layout.iconButtonSize,
  },
  title: {
    ...typography.headerTitle,
    ...StyleSheet.absoluteFill,
    textAlign: 'center',
    lineHeight: layout.headerHeight,
    paddingHorizontal: layout.iconButtonSize + spacing.md,
  },
});
