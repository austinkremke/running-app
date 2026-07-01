import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { UserProfile } from '../../mock';
import { colors, spacing } from '../../theme';
import { ProfileAvatar } from './ProfileAvatar';
import { RankBadge } from './RankBadge';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type ProfileTopSectionProps = {
  profile: Pick<UserProfile, 'name' | 'avatarUrl' | 'clanName' | 'level' | 'rank'>;
  onEditAvatar?: () => void;
};

const AVATAR_SIZE = 92;

export function ProfileTopSection({ profile, onEditAvatar }: ProfileTopSectionProps) {
  return (
    <View style={styles.container}>
      <ProfileAvatar avatarUrl={profile.avatarUrl} onEditPress={onEditAvatar} size={AVATAR_SIZE} />

      <View style={styles.rightColumn}>
        <View style={styles.identity}>
          <Text style={styles.name}>{profile.name}</Text>
          <View style={styles.clanRow}>
            <Ionicons color={colors.accentLime} name="shield-outline" size={12} />
            <Text style={styles.clanName}>{profile.clanName}</Text>
          </View>
        </View>

        <View style={styles.levelRankRow}>
          <View style={styles.levelBlock}>
            <Text style={styles.label}>LEVEL</Text>
            <Text style={styles.levelValue}>{profile.level}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rankBlock}>
            <View style={styles.rankContent}>
              <RankBadge icon={profile.rank.icon as IoniconsName} size={36} />
              <View style={styles.rankMeta}>
                <Text style={styles.label}>RANK</Text>
                <Text style={styles.rankTitle}>{profile.rank.title}</Text>
                {profile.rank.subtitle ? (
                  <Text style={styles.rankSubtitle}>{profile.rank.subtitle}</Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rightColumn: {
    flex: 1,
    gap: spacing.lg,
  },
  identity: {
    gap: spacing.xs,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  clanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  clanName: {
    color: colors.accentLime,
    fontSize: 12,
    fontWeight: '600',
  },
  levelRankRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },
  levelBlock: {
    minWidth: 44,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  levelValue: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 36,
    marginTop: spacing.xs,
  },
  divider: {
    width: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
  },
  rankBlock: {
    flex: 1,
    minWidth: 0,
  },
  rankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rankMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  rankTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  rankSubtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 13,
  },
});
