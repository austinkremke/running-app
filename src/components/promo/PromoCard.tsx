import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';

export type PromoCardProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  ctaLabel: string;
  onPressCta: () => void;
  onDismiss: () => void;
  /** Optional progress bar (e.g. XP toward a level gate) — omit for offers with nothing to track. */
  progress?: { ratio: number; label: string };
};

/** Generic dismissable promo/announcement card — content is fully caller-driven so this can host any future offer, not just the level-boost IAP. */
export function PromoCard({
  icon,
  title,
  description,
  ctaLabel,
  onPressCta,
  onDismiss,
  progress,
}: PromoCardProps) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityLabel="Dismiss"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onDismiss}
        style={styles.dismissButton}
      >
        <Ionicons color={colors.textSecondary} name="close" size={16} />
      </Pressable>

      <View style={styles.content}>
        {icon ? (
          <View style={styles.iconWrap}>
            <Ionicons color={colors.accentLime} name={icon} size={22} />
          </View>
        ) : null}

        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>

      {progress ? (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${Math.min(1, Math.max(0, progress.ratio)) * 100}%` }]}
            />
          </View>
          <Text style={styles.progressLabel}>{progress.label}</Text>
        </View>
      ) : null}

      <Pressable onPress={onPressCta} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
        <Text style={styles.ctaLabel}>{ctaLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.accentLime,
    shadowColor: colors.accentLime,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  dismissButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
    padding: spacing.xs,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(215, 255, 47, 0.12)',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  description: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  progressWrap: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accentLime,
  },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  cta: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.accentLime,
    alignItems: 'center',
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaLabel: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '800',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
