import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TeamMatchCompletion } from '../../../types/teamMatchCompletion';
import { colors, spacing } from '../../../theme';
import { BottomSheetDrawer } from '../../drawer';
import { formatMatchPoints } from './matchTheme';

type TeamMatchResultDrawerProps = {
  visible: boolean;
  completion: TeamMatchCompletion | null;
  onClose: () => void | Promise<void>;
};

function outcomeCopy(outcome: TeamMatchCompletion['outcome']) {
  if (outcome === 'win') {
    return {
      title: 'Your Team Won',
      subtitle: 'Victory secured',
      color: colors.accentLime,
      icon: 'trophy' as const,
    };
  }

  if (outcome === 'loss') {
    return {
      title: 'Your Team Lost',
      subtitle: 'Better luck next match',
      color: '#FF6B6B',
      icon: 'close-circle' as const,
    };
  }

  return {
    title: 'Match Tied',
    subtitle: 'Even match — no rating change',
    color: colors.textSecondary,
    icon: 'remove-circle' as const,
  };
}

function formatRatingDelta(delta: number) {
  if (delta > 0) {
    return `+${delta}`;
  }

  return `${delta}`;
}

export function TeamMatchResultDrawer({ visible, completion, onClose }: TeamMatchResultDrawerProps) {
  if (!completion) {
    return null;
  }

  const copy = outcomeCopy(completion.outcome);
  const seasonWins = completion.seasonWins ?? 0;
  const seasonLosses = completion.seasonLosses ?? 0;

  return (
    <BottomSheetDrawer
      accessibilityLabel="Close match result"
      footer={
        <Pressable
          accessibilityLabel="Continue"
          accessibilityRole="button"
          onPress={() => {
            void onClose();
          }}
          style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}
        >
          <Text style={styles.continueLabel}>Continue</Text>
        </Pressable>
      }
      heightRatio={0.72}
      onClose={() => {
        void onClose();
      }}
      visible={visible}
    >
      <View style={styles.content}>
        <View style={[styles.iconWrap, { borderColor: copy.color }]}>
          <Ionicons color={copy.color} name={copy.icon} size={28} />
        </View>

        <Text style={styles.eyebrow}>Match Complete</Text>
        <Text style={[styles.title, { color: copy.color }]}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreEyebrow}>Final Score</Text>
          <Text style={styles.scoreLine}>
            Your Team {formatMatchPoints(completion.myPoints)} —{' '}
            {formatMatchPoints(completion.opponentPoints)} {completion.opponentTeamName}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEyebrow}>Rating</Text>
            <Text style={[styles.statValue, completion.ratingDelta >= 0 ? styles.positive : styles.negative]}>
              {formatRatingDelta(completion.ratingDelta)}
            </Text>
            <Text style={styles.statMeta}>{completion.newRating.toLocaleString()} PWR</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEyebrow}>Season</Text>
            <Text style={styles.statValue}>
              {seasonWins}W — {seasonLosses}L
            </Text>
            <Text style={styles.statMeta}>Updated record</Text>
          </View>
        </View>
      </View>
    </BottomSheetDrawer>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  scoreCard: {
    width: '100%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
    alignItems: 'center',
  },
  scoreEyebrow: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  scoreLine: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
    alignItems: 'center',
  },
  statEyebrow: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  positive: {
    color: colors.accentLime,
  },
  negative: {
    color: '#FF6B6B',
  },
  statMeta: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  continueButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentLime,
    borderRadius: 14,
    paddingVertical: spacing.md,
  },
  continueLabel: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.9,
  },
});
