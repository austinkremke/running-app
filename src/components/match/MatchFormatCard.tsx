import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { TeamMatchFormat } from '../../mock';
import { colors, spacing } from '../../theme';

const CARD_BACKGROUND = require('../../../assets/team-match-card.png');
// Native size of team-match-card.png — pins the image's aspect ratio so it's
// sized by width alone (see cardBackgroundImage) rather than stretched to fill
// whatever height the card's text content happens to produce.
const CARD_BACKGROUND_ASPECT_RATIO = 1672 / 941;

type MatchFormatCardProps = {
  format: TeamMatchFormat;
};

export function MatchFormatCard({ format }: MatchFormatCardProps) {
  return (
    <View style={styles.card}>
      <Image resizeMode="cover" source={CARD_BACKGROUND} style={styles.cardBackgroundImage} />

      <LinearGradient
        colors={['transparent', 'rgba(5, 7, 11, 0.55)', 'rgba(5, 7, 11, 0.92)']}
        end={{ x: 1, y: 0 }}
        locations={[0.35, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        style={styles.cardOverlay}
      />

      <View style={styles.durationBadge}>
        <Ionicons color={colors.accentLime} name="calendar-outline" size={10} />
        <Text style={styles.durationText}>{format.durationLabel}</Text>
      </View>

      <View style={styles.contentColumn}>
        <Text style={styles.title}>{format.title}</Text>
        <Text style={styles.winCondition}>{format.winCondition}</Text>

        <View style={styles.divider} />

        <Text style={styles.overview}>{format.overview}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardBackgroundImage: {
    // Full card width, natural aspect ratio, top-aligned. RN Image keeps its
    // intrinsic pixel height unless `height` is cleared, which made `cover`
    // center-crop and cut off the runners. Excess height clips at the bottom.
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: undefined,
    aspectRatio: CARD_BACKGROUND_ASPECT_RATIO,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFill,
  },
  contentColumn: {
    alignSelf: 'flex-end',
    width: '40%',
    padding: spacing.md,
    gap: spacing.sm,
  },
  durationBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accentLime,
    backgroundColor: 'rgba(215, 255, 47, 0.08)',
  },
  durationText: {
    color: colors.accentLime,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  winCondition: {
    color: colors.accentLime,
    fontSize: 11,
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  overview: {
    color: colors.textPrimary,
    fontSize: 11,
    lineHeight: 16,
  },
});
