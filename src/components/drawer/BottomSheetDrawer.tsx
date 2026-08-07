import { ReactNode, useEffect, useState } from 'react';
import { Dimensions, Keyboard, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DISMISS_THRESHOLD = 100;
const HANDLE_ZONE_HEIGHT = 48;
const TOP_CLEARANCE = spacing.sm;
const SPRING_CONFIG = { damping: 32, stiffness: 300, mass: 0.9 };

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
  const translateY = useSharedValue(preferredHeight);

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
      translateY.value = preferredHeight;
      translateY.value = withSpring(0, SPRING_CONFIG);
    }
  }, [preferredHeight, translateY, visible]);

  function dismissDrawer() {
    translateY.value = withTiming(preferredHeight, { duration: 240 }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  }

  const panGesture = Gesture.Pan()
    .activeOffsetY(4)
    .failOffsetY(-10)
    .failOffsetX([-10, 10])
    .hitSlop({ top: 0, height: HANDLE_ZONE_HEIGHT })
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      const nextY = Math.max(0, event.translationY);
      if (nextY > DISMISS_THRESHOLD || event.velocityY > 750) {
        translateY.value = withTiming(preferredHeight, { duration: 240 }, (finished) => {
          if (finished) {
            runOnJS(onClose)();
          }
        });
        return;
      }
      translateY.value = withSpring(0, SPRING_CONFIG);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) {
    return null;
  }

  const drawer = (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.drawer,
          animatedStyle,
          {
            height: drawerHeight,
            marginBottom: keyboardOffset,
            paddingBottom: keyboardOffset > 0 ? spacing.md : Math.max(insets.bottom, spacing.md),
          },
        ]}
      >
        <View style={styles.handleArea}>
          <View style={styles.handle} />
        </View>

        <View style={styles.content}>{children}</View>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </Animated.View>
    </GestureDetector>
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
