import { StyleSheet, Text, View } from 'react-native';

import type { RunPaceHighlight } from '../../mock';
import { colors, spacing } from '../../theme';

type RunCardPaceHighlightProps = {
  highlight: RunPaceHighlight;
};

export function RunCardPaceHighlight({ highlight }: RunCardPaceHighlightProps) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <Text style={styles.label}>{highlight.label}</Text>
        <Text style={styles.detail}>{highlight.detail}</Text>
      </View>
      <Text style={styles.value}>{highlight.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  detail: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  value: {
    color: colors.accentLime,
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
