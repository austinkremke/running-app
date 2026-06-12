import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { TopTeamListing } from '../../../mock';
import { colors, spacing } from '../../../theme';
import { HexBadge } from '../../me/HexBadge';
import { TopTeamShield } from './TopTeamShield';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type TopTeamsTeamCardProps = {
  team: TopTeamListing;
};

function formatPoints(value: number): string {
  return value.toLocaleString('en-US');
}

export function TopTeamsTeamCard({ team }: TopTeamsTeamCardProps) {
  const isTopRank = team.rank === 1;

  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <View style={styles.leading}>
          <Text
            numberOfLines={1}
            style={[styles.rank, isTopRank ? styles.rankTop : styles.rankDefault]}
          >
            {team.rank}
          </Text>
          <TopTeamShield accent={team.shieldAccent} icon={team.shieldIcon as IoniconsName} />
        </View>

        <View style={styles.identity}>
          <Text style={styles.name}>{team.name.toUpperCase()}</Text>
          <Text numberOfLines={2} style={styles.motto}>
            {team.motto}
          </Text>

          <View style={styles.levelRow}>
            <HexBadge icon="paw" iconSize={11} size={26} variant="purple" />
            <View style={styles.levelMeta}>
              <Text style={styles.levelLabel}>LEVEL</Text>
              <Text style={styles.levelValue}>{team.level}</Text>
            </View>
          </View>
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
            <Text style={styles.pointsLabel}>Total Points</Text>
          </View>
        </View>
      </View>
    </View>
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
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  levelMeta: {
    gap: 0,
  },
  levelLabel: {
    color: colors.accentPurple,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  levelValue: {
    color: colors.accentPurple,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    lineHeight: 18,
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
