import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useUserId } from '../../context';
import type { FollowSearchResult } from '../../services/followService';
import {
  fetchInvitableFollowing,
  inviteToTeam,
  searchInvitableUsers,
} from '../../services/teamMembershipService';
import { colors, spacing } from '../../theme';
import { BottomSheetDrawer } from '../drawer';

const AVATAR_SIZE = 40;
const SEARCH_MIN_CHARS = 2;

type InviteToTeamDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

export function InviteToTeamDrawer({ visible, onClose }: InviteToTeamDrawerProps) {
  const userId = useUserId();
  const [query, setQuery] = useState('');
  const [following, setFollowing] = useState<FollowSearchResult[]>([]);
  const [results, setResults] = useState<FollowSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  const searching = query.trim().length >= SEARCH_MIN_CHARS;
  const shown = searching ? results : following;

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setInvitedIds(new Set());
      return;
    }

    if (!userId) return;

    setLoading(true);
    fetchInvitableFollowing(userId)
      .then(setFollowing)
      .catch(() => setFollowing([]))
      .finally(() => setLoading(false));
  }, [userId, visible]);

  useEffect(() => {
    if (!visible || !userId || !searching) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(() => {
      searchInvitableUsers(query, userId)
        .then((rows) => {
          if (!cancelled) setResults(rows);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, searching, userId, visible]);

  const handleInvite = useCallback(async (targetId: string) => {
    setPendingId(targetId);
    try {
      await inviteToTeam(targetId);
      setInvitedIds((previous) => new Set(previous).add(targetId));
    } catch (error) {
      console.warn('Could not send team invite', error);
    } finally {
      setPendingId(null);
    }
  }, []);

  return (
    <BottomSheetDrawer heightRatio={0.72} keyboardAvoiding onClose={onClose} visible={visible}>
      <View style={styles.container}>
        <Text style={styles.title}>Invite to Team</Text>

        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Search all runners by name…"
          placeholderTextColor={colors.textSecondary}
          style={styles.search}
          value={query}
        />

        <Text style={styles.sectionLabel}>
          {searching ? 'Search results' : 'People you follow, not on a team'}
        </Text>

        {loading && shown.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accentLime} />
          </View>
        ) : shown.length === 0 ? (
          <Text style={styles.empty}>
            {searching
              ? 'No teamless runners match that name.'
              : 'Everyone you follow is already on a team. Search to invite anyone.'}
          </Text>
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.list}>
              {shown.map((person) => {
                const invited = invitedIds.has(person.id);
                const busy = pendingId === person.id;

                return (
                  <View key={person.id} style={styles.row}>
                    <View style={styles.avatarRing}>
                      {person.avatarUrl ? (
                        <Image source={{ uri: person.avatarUrl }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]} />
                      )}
                    </View>

                    <View style={styles.meta}>
                      <Text numberOfLines={1} style={styles.name}>
                        {person.displayName}
                      </Text>
                      <Text style={styles.sub}>Level {person.level}</Text>
                    </View>

                    <Pressable
                      accessibilityLabel={`Invite ${person.displayName}`}
                      accessibilityRole="button"
                      disabled={invited || busy}
                      onPress={() => void handleInvite(person.id)}
                      style={({ pressed }) => [
                        styles.inviteButton,
                        (invited || busy) && styles.inviteButtonDisabled,
                        pressed && !invited && !busy ? styles.pressed : null,
                      ]}
                    >
                      {busy ? (
                        <ActivityIndicator color={colors.background} size="small" />
                      ) : (
                        <Text style={styles.inviteLabel}>{invited ? 'Invited' : 'Invite'}</Text>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </BottomSheetDrawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 14,
    backgroundColor: colors.background,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  centered: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  empty: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: spacing.lg,
    lineHeight: 17,
  },
  list: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceElevated,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  inviteButton: {
    minWidth: 76,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentLime,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  inviteButtonDisabled: {
    backgroundColor: colors.surfaceElevated,
  },
  inviteLabel: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.85,
  },
});
