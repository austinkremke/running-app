import { StyleSheet, Text, View } from 'react-native';

import { HeaderIconButton } from '../header';
import { colors, layout, spacing } from '../../theme';

type PostRunHeaderProps = {
  completedAtLabel: string;
  sourceName?: string;
  onBack?: () => void;
};

export function PostRunHeader({ completedAtLabel, sourceName, onBack }: PostRunHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        <HeaderIconButton
          accessibilityLabel="Go back"
          icon="chevron-back"
          onPress={onBack}
        />
      </View>

      <View style={styles.center}>
        <Text style={styles.title}>RUN COMPLETE</Text>
        <Text style={styles.subtitle}>{completedAtLabel}</Text>
        {sourceName ? <Text style={styles.subtitle}>Synced from {sourceName}</Text> : null}
      </View>

      <View style={[styles.side, styles.sideRight]}>
        <HeaderIconButton accessibilityLabel="Share run" icon="share-outline" onPress={() => {}} />
        <HeaderIconButton
          accessibilityLabel="More options"
          icon="ellipsis-vertical"
          onPress={() => {}}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.headerHeight,
    paddingHorizontal: spacing.xs,
  },
  side: {
    width: layout.headerSideWidth * 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.6,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
});
