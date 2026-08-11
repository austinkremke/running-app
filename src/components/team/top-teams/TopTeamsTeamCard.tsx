import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TopTeamListing } from '../../../mock';
import { colors, spacing } from '../../../theme';
import { TeamAvatar } from '../TeamAvatar';

type TopTeamsTeamCardProps = {
  team: TopTeamListing;
  onPress?: () => void;
};

function formatPoints(value: number): string {
  return value.toLocaleString('en-US');
}

export function TopTeamsTeamCard({ team, onPress }: TopTeamsTeamCardProps) {
  const isTopRank = team.rank === 1;

  return (
    <Pressable
      accessibilityHint="Opens this team"
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.pressed : null]}
    >
      <View style={styles.cardBody}>
        <View style={styles.leading}>
          <Text
            numberOfLines={1}
            style={[styles.rank, isTopRank ? styles.rankTop : styles.rankDefault]}
          >
            {team.rank}
          </Text>
          <TeamAvatar
            accent={team.shieldAccent}
            icon={team.shieldIcon}
            imageUrl={team.logoUrl}
            rankTierId={team.rankTierId}
            size={52}
          />
        </View>

        <View style={styles.identity}>
          <Text style={styles.name}>{team.name.toUpperCase()}</Text>
          <Text numberOfLines={2} style={styles.motto}>
            {team.motto}
          </Text>
        </View>

        <View style={styles.trailing}>
          <View style={styles.membersBlock}>
            <Ionicons color={colors.textSecondary} name="people-outline" size={14} />
            <View style={styles.membersMeta}>
              <Text style={styles.membersCount}>
                {team.memberCount}/{team.memberMax}
              </Text>
              <Text style={styles.membersLabel}>Members</Text>
            </View>
          </View>

          <View style={styles.pointsBlock}>
            <Text style={styles.pointsValue}>{formatPoints(team.totalPoints)}</Text>
            <Text style={styles.pointsLabel}>Power Rating</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const LEADING_INSET = spacing.md;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingRight: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LEADING_INSET,
    paddingLeft: LEADING_INSET,
    flexShrink: 0,
  },
  rank: {
    minWidth: 24,
    flexShrink: 0,
    fontSize: 26,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 28,
    textAlign: 'center',
  },
  rankTop: {
    color: colors.accentLime,
  },
  rankDefault: {
    color: colors.textPrimary,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    justifyContent: 'center',
  },
  name: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
  motto: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 13,
  },
  trailing: {
    flexShrink: 0,
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minWidth: 72,
    paddingTop: 2,
    paddingBottom: 2,
  },
  membersBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  membersMeta: {
    alignItems: 'flex-end',
    gap: 1,
  },
  membersCount: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  membersLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '600',
  },
  pointsBlock: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
  pointsValue: {
    color: colors.accentLime,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    lineHeight: 17,
  },
  pointsLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 1,
  },
});
