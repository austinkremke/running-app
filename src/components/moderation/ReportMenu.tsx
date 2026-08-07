import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheetDrawer } from '../drawer';
import { useBlockedUsers } from '../../context';
import { reportContent, type ReportableContentType } from '../../services/moderationService';
import { colors, spacing } from '../../theme';

const REPORT_REASONS = ['Spam', 'Harassment or abuse', 'Inappropriate content', 'Other'] as const;

type ReportMenuProps = {
  visible: boolean;
  onClose: () => void;
  contentType: ReportableContentType;
  contentId: string;
  /** Omit (or the viewer's own id) to hide the "Block user" option — you
   *  can't block yourself, and reporting your own content isn't useful. */
  reportedUserId?: string | null;
};

type Mode = 'menu' | 'reason';

export function ReportMenu({ visible, onClose, contentType, contentId, reportedUserId }: ReportMenuProps) {
  const { block } = useBlockedUsers();
  const [mode, setMode] = useState<Mode>('menu');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setMode('menu');
    setSubmitting(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function submitReport(reason: string) {
    setSubmitting(true);
    try {
      await reportContent(contentType, contentId, reportedUserId, reason);
      handleClose();
      Alert.alert('Reported', "Thanks — we'll review this within 24 hours.");
    } catch (error) {
      setSubmitting(false);
      Alert.alert(
        'Could not submit report',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  }

  function confirmBlock() {
    if (!reportedUserId) return;

    Alert.alert('Block this user?', "You won't see their content anymore, and they won't see yours.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setSubmitting(true);
            try {
              await block(reportedUserId);
              handleClose();
            } catch (error) {
              setSubmitting(false);
              Alert.alert(
                'Could not block user',
                error instanceof Error ? error.message : 'Please try again.',
              );
            }
          })();
        },
      },
    ]);
  }

  return (
    <BottomSheetDrawer
      accessibilityLabel="Close menu"
      heightRatio={mode === 'reason' ? 0.42 : 0.3}
      onClose={handleClose}
      visible={visible}
    >
      <View style={styles.content}>
        {mode === 'menu' ? (
          <>
            <Text style={styles.title}>Options</Text>

            <Pressable
              accessibilityLabel="Report"
              accessibilityRole="button"
              disabled={submitting}
              onPress={() => setMode('reason')}
              style={({ pressed }) => [styles.option, pressed && styles.pressed]}
            >
              <Text style={styles.optionLabel}>Report</Text>
              <Text style={styles.optionSubtext}>Flag this for review</Text>
            </Pressable>

            {reportedUserId ? (
              <Pressable
                accessibilityLabel="Block user"
                accessibilityRole="button"
                disabled={submitting}
                onPress={confirmBlock}
                style={({ pressed }) => [styles.option, pressed && styles.pressed]}
              >
                <Text style={[styles.optionLabel, styles.dangerLabel]}>Block User</Text>
                <Text style={styles.optionSubtext}>
                  Hide their content from you, and yours from them
                </Text>
              </Pressable>
            ) : null}

            {submitting ? <ActivityIndicator color={colors.accentLime} /> : null}
          </>
        ) : (
          <>
            <Text style={styles.title}>Why are you reporting this?</Text>
            {REPORT_REASONS.map((reason) => (
              <Pressable
                accessibilityLabel={reason}
                accessibilityRole="button"
                disabled={submitting}
                key={reason}
                onPress={() => {
                  void submitReport(reason);
                }}
                style={({ pressed }) => [styles.option, pressed && styles.pressed]}
              >
                <Text style={styles.optionLabel}>{reason}</Text>
              </Pressable>
            ))}
            {submitting ? <ActivityIndicator color={colors.accentLime} /> : null}
          </>
        )}
      </View>
    </BottomSheetDrawer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  title: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  option: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  optionLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  dangerLabel: {
    color: colors.danger,
  },
  optionSubtext: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  pressed: {
    opacity: 0.85,
  },
});
