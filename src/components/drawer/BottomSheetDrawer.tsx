import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DISMISS_THRESHOLD = 100;
const HANDLE_ZONE_HEIGHT = 48;
const TOP_CLEARANCE = spacing.sm;

type BottomSheetDrawerProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  heightRatio?: number;
  keyboardAvoiding?: boolean;
  accessibilityLabel?: string;
};

export function BottomSheetDrawer({
  visible,
  onClose,
  children,
  footer,
  heightRatio = 0.6,
  keyboardAvoiding = false,
  accessibilityLabel = 'Close drawer',
}: BottomSheetDrawerProps) {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const preferredHeight = SCREEN_HEIGHT * heightRatio;
  const keyboardOffset = keyboardAvoiding ? keyboardHeight : 0;
  const maxHeight =
    keyboardOffset > 0
      ? SCREEN_HEIGHT - keyboardOffset - insets.top - TOP_CLEARANCE
      : SCREEN_HEIGHT - insets.top - TOP_CLEARANCE;
  const drawerHeight = Math.min(preferredHeight, maxHeight);
  const translateY = useRef(new Animated.Value(preferredHeight)).current;
  const isClosing = useRef(false);
  const dragStartY = useRef(0);
  const touchStartInHandleZone = useRef(false);

  useEffect(() => {
    if (!keyboardAvoiding) {
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardAvoiding]);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      isClosing.current = false;
      translateY.setValue(preferredHeight);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }).start();
    }
  }, [preferredHeight, translateY, visible]);

  function dismissDrawer(onComplete?: () => void) {
    if (isClosing.current) {
      return;
    }

    isClosing.current = true;
    Animated.timing(translateY, {
      toValue: preferredHeight,
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

  const drawer = (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.drawer,
        {
          height: drawerHeight,
          marginBottom: keyboardOffset,
          paddingBottom: keyboardOffset > 0 ? spacing.md : Math.max(insets.bottom, spacing.md),
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
  );

  return (
    <Modal animationType="none" onRequestClose={() => dismissDrawer()} transparent visible>
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel={accessibilityLabel}
          onPress={() => dismissDrawer()}
          style={styles.backdrop}
        />
        {drawer}
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
