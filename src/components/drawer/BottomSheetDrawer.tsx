import { ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DISMISS_THRESHOLD = 100;
const HANDLE_ZONE_HEIGHT = 48;

type BottomSheetDrawerProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  heightRatio?: number;
  accessibilityLabel?: string;
};

export function BottomSheetDrawer({
  visible,
  onClose,
  children,
  footer,
  heightRatio = 0.6,
  accessibilityLabel = 'Close drawer',
}: BottomSheetDrawerProps) {
  const insets = useSafeAreaInsets();
  const drawerHeight = SCREEN_HEIGHT * heightRatio;
  const translateY = useRef(new Animated.Value(drawerHeight)).current;
  const isClosing = useRef(false);
  const dragStartY = useRef(0);
  const touchStartInHandleZone = useRef(false);

  useEffect(() => {
    if (visible) {
      isClosing.current = false;
      translateY.setValue(drawerHeight);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }).start();
    }
  }, [drawerHeight, translateY, visible]);

  function dismissDrawer(onComplete?: () => void) {
    if (isClosing.current) {
      return;
    }

    isClosing.current = true;
    Animated.timing(translateY, {
      toValue: drawerHeight,
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
        touchStartInHandleZone.current = event.nativeEvent.locationY < HANDLE_ZONE_HEIGHT;
        return touchStartInHandleZone.current;
      },
      onMoveShouldSetPanResponder: (_, gesture) => {
        const pullingDown = gesture.dy > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
        return pullingDown && touchStartInHandleZone.current;
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

  if (!visible) {
    return null;
  }

  return (
    <Modal animationType="none" onRequestClose={() => dismissDrawer()} transparent visible>
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel={accessibilityLabel}
          onPress={() => dismissDrawer()}
          style={styles.backdrop}
        />

        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.drawer,
            {
              height: drawerHeight,
              paddingBottom: Math.max(insets.bottom, spacing.md),
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handleArea}>
            <View style={styles.handle} />
          </View>

          <View style={styles.content}>{children}</View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
});
