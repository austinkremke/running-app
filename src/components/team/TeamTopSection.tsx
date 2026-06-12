import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Team } from '../../mock';
import { colors, spacing } from '../../theme';
import { TeamLevelXpRow } from './TeamLevelXpRow';
import { TeamRankCard } from './TeamRankCard';
import { TeamShieldLogo } from './TeamShieldLogo';

type TeamTopSectionProps = {
  team: Pick<
    Team,
    'name' | 'tag' | 'motto' | 'level' | 'experience' | 'teamRank'
  >;
  onRankPress?: () => void;
};

export function TeamTopSection({ team, onRankPress }: TeamTopSectionProps) {
  return (
    <View style={styles.container}>
      <TeamShieldLogo />

      <View style={styles.content}>
        <View style={styles.meta}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.name}>
              {team.name}
            </Text>
            <Pressable accessibilityLabel="Edit team name" hitSlop={8} style={styles.editButton}>
              <Ionicons color={colors.textSecondary} name="pencil" size={12} />
            </Pressable>
          </View>

          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{team.tag}</Text>
            </View>
            <Text numberOfLines={1} style={styles.motto}>
              {team.motto}
            </Text>
          </View>

          <TeamLevelXpRow experience={team.experience} level={team.level} />
        </View>

        <TeamRankCard onPress={onRankPress} teamRank={team.teamRank} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.xl,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    minWidth: 0,
    gap: spacing.sm,
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  editButton: {
    flexShrink: 0,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    flexShrink: 0,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tagText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  motto: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
  },
});
