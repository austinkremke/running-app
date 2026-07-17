import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useFriendSearch } from '../../hooks/useFriendSearch';
import type { FriendSearchResult } from '../../services/friendService';
import { colors, spacing } from '../../theme';
import { BottomSheetDrawer } from '../drawer';
import { FriendSearchResultRow } from './FriendSearchResultRow';

type FindFriendsDrawerProps = {
  visible: boolean;
  viewerUserId: string | null;
  isFriend: (userId: string) => boolean;
  isFriendPending?: (userId: string) => boolean;
  addingFriendId?: string | null;
  onAddFriend: (result: FriendSearchResult) => void;
  onClose: () => void;
  onOpenProfile?: (result: FriendSearchResult) => void;
};

export function FindFriendsDrawer({
  visible,
  viewerUserId,
  isFriend,
  isFriendPending,
  addingFriendId = null,
  onAddFriend,
  onClose,
  onOpenProfile,
}: FindFriendsDrawerProps) {
  const { query, setQuery, results, loading, error } = useFriendSearch(viewerUserId, visible);

  const trimmed = query.trim();
  const showHint = trimmed.length < 2;
  const showEmpty = !showHint && !loading && !error && results.length === 0;

  return (
    <BottomSheetDrawer
      accessibilityLabel="Close find friends"
      heightRatio={0.72}
      keyboardAvoiding
      onClose={onClose}
      visible={visible}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Find Friends</Text>
        <Text style={styles.subtitle}>Search by display name to add runners you know.</Text>

        <View style={styles.searchField}>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            clearButtonMode="while-editing"
            onChangeText={setQuery}
            placeholder="Search by name"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            style={styles.input}
            value={query}
          />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accentLime} />
          </View>
        ) : error ? (
          <Text style={styles.message}>{error}</Text>
        ) : showHint ? (
          <Text style={styles.message}>Type at least 2 characters to search.</Text>
        ) : showEmpty ? (
          <Text style={styles.message}>No runners found. Try a different name.</Text>
        ) : (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <FriendSearchResultRow
                adding={addingFriendId === item.id}
                isFriend={isFriend(item.id)}
                isFriendPending={isFriendPending?.(item.id)}
                onAddFriend={() => onAddFriend(item)}
                onOpenProfile={onOpenProfile ? () => onOpenProfile(item) : undefined}
                result={item}
                showDivider={index < results.length - 1}
              />
            )}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />
        )}
      </View>
    </BottomSheetDrawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: spacing.md,
  },
  searchField: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  input: {
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: spacing.sm,
  },
  list: {
    flex: 1,
  },
  listContent: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
});
