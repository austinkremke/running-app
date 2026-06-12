import { StyleSheet, Text, View } from 'react-native';

import type { TeamMatchTeam } from '../../../mock';
import { colors, spacing } from '../../../theme';
import {
  formatMatchPoints,
  getTeamMatchAccentColor,
  getTeamMatchAccentTint,
} from './matchTheme';
import { TeamMatchRosterRow } from './TeamMatchRosterRow';

type TeamMatchRosterColumnProps = {
  team: TeamMatchTeam;
};

export function TeamMatchRosterColumn({ team }: TeamMatchRosterColumnProps) {
  const accentColor = getTeamMatchAccentColor(team.accent);

  return (
    <View style={styles.column}>
      <View style={[styles.header, { backgroundColor: getTeamMatchAccentTint(team.accent) }]}>
        <Text numberOfLines={1} style={styles.headerName}>
          {team.name.toUpperCase()}
        </Text>
        <Text style={[styles.headerTotal, { color: accentColor }]}>
          TOTAL {formatMatchPoints(team.totalPoints)}
        </Text>
      </View>

      <View style={styles.list}>
        {team.members.map((participant, index) => (
          <TeamMatchRosterRow
            accent={team.accent}
            key={participant.id}
            participant={participant}
            showDivider={index < team.members.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
  },
  headerTotal: {
    fontSize: 9,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
  list: {
    paddingBottom: spacing.xs,
  },
});
