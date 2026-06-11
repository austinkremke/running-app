import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ChallengeFriend } from '../../../mock';
import { colors, spacing } from '../../../theme';
import { ChallengeFriendRow } from './ChallengeFriendRow';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.67;
const DISMISS_THRESHOLD = 100;
const DRAG_ZONE_HEIGHT = 96;

type ChallengeFriendDrawerProps = {
  visible: boolean;
  friends: ChallengeFriend[];
  selectedFriendId: string | null;
  onSelectFriend: (friendId: string) => void;
  onSendInvite: () => void;
  onClose: () => void;
};

export function ChallengeFriendDrawer({
  visible,
  friends,
  selectedFriendId,
  onSelectFriend,
  onSendInvite,
  onClose,
}: ChallengeFriendDrawerProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
  const isClosing = useRef(false);
  const dragStartY = useRef(0);
  const scrollOffsetY = useRef(0);
  const touchStartInDragZone = useRef(false);

  useEffect(() => {
    if (visible) {
      isClosing.current = false;
      translateY.setValue(DRAWER_HEIGHT);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }).start();
    }
  }, [translateY, visible]);

  function dismissDrawer(onComplete?: () => void) {
    if (isClosing.current) {
      return;
    }

    isClosing.current = true;
    Animated.timing(translateY, {
      toValue: DRAWER_HEIGHT,
      duration: 240,
      useNativeDriver: true,
    }).start(() => {
      isClosing.current = false;
      onComplete?.();
      onClose();
    });
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (event) => {
        touchStartInDragZone.current = event.nativeEvent.locationY < DRAG_ZONE_HEIGHT;
        return touchStartInDragZone.current;
      },
      onMoveShouldSetPanResponder: (_, gesture) => {
        const pullingDown = gesture.dy > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
        const listAtTop = scrollOffsetY.current <= 0;

        return pullingDown && (touchStartInDragZone.current || listAtTop);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        translateY.stopAnimation((value) => {
          dragStartY.current = value;
        });
      },
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(dragStartY.current + gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        const nextY = dragStartY.current + Math.max(0, gesture.dy);

        if (nextY > DISMISS_THRESHOLD || gesture.vy > 0.75) {
          dismissDrawer();
          return;
        }

        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 220,
        }).start();
      },
    }),
  ).current;

  function handleSendInvite() {
    if (!selectedFriendId) {
      return;
    }

    dismissDrawer(onSendInvite);
  }

  if (!visible) {
    return null;
  }

  return (
    <Modal animationType="none" onRequestClose={() => dismissDrawer()} transparent visible>
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Close friend picker"
          onPress={() => dismissDrawer()}
          style={styles.backdrop}
        />

        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.drawer,
            {
              height: DRAWER_HEIGHT,
              paddingBottom: Math.max(insets.bottom, spacing.md),
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handleArea}>
            <View style={styles.handle} />
            <Text style={styles.title}>Challenge a Friend</Text>
            <Text style={styles.subtitle}>Select a friend to send a 1v1 challenge.</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.listContent}
            onScroll={(event) => {
              scrollOffsetY.current = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          >
            <View style={styles.listCard}>
              {friends.map((friend, index) => (
                <ChallengeFriendRow
                  key={friend.id}
                  friend={friend}
                  onPress={() => onSelectFriend(friend.id)}
                  selected={friend.id === selectedFriendId}
                  showDivider={index < friends.length - 1}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              accessibilityLabel="Send challenge invite"
              accessibilityRole="button"
              accessibilityState={{ disabled: !selectedFriendId }}
              disabled={!selectedFriendId}
              onPress={handleSendInvite}
              style={({ pressed }) => [
                styles.sendButton,
                !selectedFriendId && styles.sendButtonDisabled,
                pressed && selectedFriendId ? styles.pressed : null,
              ]}
            >
              <Text style={[styles.sendLabel, !selectedFriendId && styles.sendLabelDisabled]}>
                Send Challenge Invite
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  drawer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  handleArea: {
    alignItems: 'center',
    minHeight: DRAG_ZONE_HEIGHT,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  listCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  footer: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  sendButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentLime,
    borderRadius: 14,
    paddingVertical: spacing.md,
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceElevated,
  },
  sendLabel: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sendLabelDisabled: {
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.9,
  },
});
