import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { LevelGateProgress } from '../../hooks/useLevelGateProgress';
import type { TopTeamListing } from '../../mock';
import { colors, spacing } from '../../theme';
import { TeamAvatar } from './TeamAvatar';

type TeamJoinPromptProps = {
  teams: TopTeamListing[];
  loadingTeams?: boolean;
  /** Team id whose request is in flight; disables all request buttons while set. */
  joiningTeamId?: string | null;
  /** Teams the user has already requested to join this session. */
  requestedTeamIds?: Set<string>;
  onJoinTeam: (teamId: string) => void;
  onCreate?: () => void;
  /** Level-gate CTA, e.g. "Reach level 10" — locks the create button when set. */
  createLockedLabel?: string | null;
  /** Makes the grind concrete on the locked card — omit to just show createLockedLabel with no bar. */
  createGateProgress?: LevelGateProgress | null;
  /** Surfaces the level-boost offer — omit to hide the skip button entirely. */
  onSkipGate?: () => void;
};

export function TeamJoinPrompt({
  teams,
  loadingTeams = false,
  joiningTeamId = null,
  requestedTeamIds,
  onJoinTeam,
  onCreate,
  createLockedLabel = null,
  createGateProgress = null,
  onSkipGate,
}: TeamJoinPromptProps) {
  const createLocked = Boolean(createLockedLabel);
  const joining = Boolean(joiningTeamId);
  const progressRatio = createGateProgress
    ? Math.min(1, Math.max(0, createGateProgress.ratio))
    : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a team</Text>
      <Text style={styles.body}>
        Team runs, chat, and feed posts show up here once you join a squad.
      </Text>

      {loadingTeams ? (
        <View style={styles.listPlaceholder}>
          <ActivityIndicator color={colors.accentLime} />
        </View>
      ) : teams.length > 0 ? (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
          {teams.map((team, index) => (
            <View key={team.id}>
              <View style={styles.teamRow}>
                <TeamAvatar
                  accent={team.shieldAccent}
                  icon={team.shieldIcon}
                  imageUrl={team.logoUrl}
                  rankTierId={team.rankTierId}
                  size={34}
                />
                <View style={styles.teamMeta}>
                  <Text numberOfLines={1} style={styles.teamName}>
                    {team.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.teamSub}>
                    {team.tag} · {team.memberCount}/{team.memberMax} members
                  </Text>
                </View>
                {(() => {
                  const full = team.memberCount >= team.memberMax;
                  const requested = requestedTeamIds?.has(team.id) ?? false;
                  const disabled = joining || full || requested;

                  return (
                    <Pressable
                      accessibilityLabel={`Request to join ${team.name}`}
                      accessibilityRole="button"
                      disabled={disabled}
                      onPress={() => onJoinTeam(team.id)}
                      style={({ pressed }) => [
                        styles.joinButton,
                        disabled && styles.joinButtonDisabled,
                        pressed && !disabled ? styles.pressed : null,
                      ]}
                    >
                      {joiningTeamId === team.id ? (
                        <ActivityIndicator color={colors.background} size="small" />
                      ) : (
                        <Text style={styles.joinLabel}>
                          {full ? 'FULL' : requested ? 'REQUESTED' : 'REQUEST'}
                        </Text>
                      )}
                    </Pressable>
                  );
                })()}
              </View>
              {index < teams.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.empty}>No teams yet — start the first one.</Text>
      )}

      {onCreate ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create a team"
          accessibilityState={{ disabled: createLocked || joining }}
          disabled={createLocked || joining}
          onPress={onCreate}
          style={({ pressed }) => [
            styles.createButton,
            createLocked && styles.createButtonLocked,
            pressed && !createLocked ? styles.pressed : null,
          ]}
        >
          {createLocked ? (
            <View style={styles.createLockedRow}>
              <Ionicons color={colors.textSecondary} name="lock-closed" size={14} />
              <Text style={styles.createLockedLabel}>
                {createLockedLabel} to create a team
              </Text>
            </View>
          ) : (
            <Text style={styles.createLabel}>CREATE A TEAM</Text>
          )}
        </Pressable>
      ) : null}

      {createLocked && createGateProgress ? (
        <View style={styles.gateProgress}>
          <View style={styles.gateProgressTrack}>
            <View style={[styles.gateProgressFill, { width: `${progressRatio * 100}%` }]} />
          </View>
          <Text style={styles.gateProgressLabel}>
            ~{createGateProgress.estimatedRuns} more run{createGateProgress.estimatedRuns === 1 ? '' : 's'} to go
          </Text>

          {onSkipGate ? (
            <Pressable
              accessibilityLabel="Skip the grind with Level 10 Boost"
              accessibilityRole="button"
              onPress={onSkipGate}
              style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
            >
              <Ionicons color={colors.accentLime} name="flash" size={14} />
              <Text style={styles.skipLabel}>Skip it — Level 10 Boost</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  listPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  teamMeta: {
    flex: 1,
    gap: 2,
  },
  teamName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  teamSub: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  joinButton: {
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentLime,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  joinButtonDisabled: {
    opacity: 0.5,
  },
  joinLabel: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  empty: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingTop: spacing.xl,
  },
  createButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.accentLime,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  createButtonLocked: {
    borderColor: colors.border,
  },
  createLockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  createLockedLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  createLabel: {
    color: colors.accentLime,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  gateProgress: {
    gap: spacing.xs,
  },
  gateProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  gateProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accentLime,
  },
  gateProgressLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  skipButton: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    backgroundColor: 'rgba(215, 255, 47, 0.12)',
  },
  skipLabel: {
    color: colors.accentLime,
    fontSize: 12,
    fontWeight: '800',
    fontStyle: 'italic',
  },
});
