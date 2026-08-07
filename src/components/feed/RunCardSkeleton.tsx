import { View, StyleSheet } from 'react-native';

import { colors, spacing } from '../../theme';
import { SkeletonBlock } from './SkeletonBlock';

const MEDIA_HEIGHT = 152;

/** Mirrors RunCard's layout (avatar + header, title/description, media
 *  carousel, stats footer) so the shimmer placeholders line up with the
 *  real card and there's no layout shift once data loads. */
export function RunCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.body}>
          <View style={styles.header}>
            <SkeletonBlock borderRadius={18} height={36} width={36} />
            <View style={styles.headerText}>
              <SkeletonBlock height={12} width="45%" />
              <SkeletonBlock height={10} width="30%" style={styles.headerSubline} />
            </View>
          </View>
          <SkeletonBlock height={14} width="70%" />
          <SkeletonBlock height={11} width="90%" />
        </View>
        <SkeletonBlock borderRadius={16} height={32} width={32} />
      </View>

      <SkeletonBlock borderRadius={10} height={MEDIA_HEIGHT} width="100%" />

      <View style={styles.footerBox}>
        <SkeletonBlock height={28} width={64} />
        <SkeletonBlock height={28} width={64} />
        <SkeletonBlock height={28} width={64} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  body: {
    flex: 1,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: {
    gap: 6,
  },
  headerSubline: {
    marginTop: 2,
  },
  footerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
});
