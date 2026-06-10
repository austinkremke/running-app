import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { MatchType } from '../../mock';
import { colors, spacing } from '../../theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type MatchDetailsCardProps = {
  matchType: MatchType;
};

export function MatchDetailsCard({ matchType }: MatchDetailsCardProps) {
  return (
    <View style={styles.card}>
      <Ionicons color={colors.accentLime} name={matchType.icon as IoniconsName} size={20} />
      <View style={styles.matchMeta}>
        <Text style={styles.matchLabel}>Match Type</Text>
        <Text style={styles.matchTitle}>{matchType.title}</Text>
        <Text style={styles.matchDescription}>{matchType.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  matchMeta: {
    flex: 1,
    gap: 2,
  },
  matchLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  matchTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  matchDescription: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
});
