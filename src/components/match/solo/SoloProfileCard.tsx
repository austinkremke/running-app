import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../../theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type SoloProfileCardProps = {
  name: string;
  avatarUrl: string;
  level: number;
  rankTitle: string;
  rankIcon: string;
};

const AVATAR_SIZE = 64;

export function SoloProfileCard({
  name,
  avatarUrl,
  level,
  rankTitle,
  rankIcon,
}: SoloProfileCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.avatarRing}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      </View>

      <View style={styles.meta}>
        <Text style={styles.name}>{name}</Text>

        <View style={styles.rankRow}>
          <View style={styles.rankShield}>
            <Ionicons color={colors.textPrimary} name={rankIcon as IoniconsName} size={10} />
          </View>
          <Text style={styles.rankTitle}>{rankTitle}</Text>
        </View>

        <Text style={styles.level}>Level {level}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.accentLime,
    padding: 2,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: AVATAR_SIZE / 2,
  },
  meta: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankShield: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentPurple,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  rankTitle: {
    color: colors.accentPurple,
    fontSize: 10,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  level: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
