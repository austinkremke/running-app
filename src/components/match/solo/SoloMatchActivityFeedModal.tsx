import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderIconButton } from '../../header';
import type { SoloMatchActivity } from '../../../mock';
import { colors, spacing } from '../../../theme';
import { SoloMatchActivityRow } from './SoloMatchActivityRow';

type SoloMatchActivityFeedModalProps = {
  visible: boolean;
  activities: SoloMatchActivity[];
  onClose: () => void;
  onSelectActivity?: (activity: SoloMatchActivity) => void;
};

export function SoloMatchActivityFeedModal({
  visible,
  activities,
  onClose,
  onSelectActivity,
}: SoloMatchActivityFeedModalProps) {
  const insets = useSafeAreaInsets();

  if (!visible) {
    return null;
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <HeaderIconButton accessibilityLabel="Close" icon="chevron-back" onPress={onClose} />
          <View style={styles.titleRow}>
            <Ionicons color={colors.accentLime} name="pulse" size={14} />
            <Text style={styles.title}>All Match Activity</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {activities.length === 0 ? (
            <Text style={styles.emptyText}>No runs logged for this match yet.</Text>
          ) : (
            <View style={styles.list}>
              {activities.map((activity, index) => (
                <SoloMatchActivityRow
                  activity={activity}
                  key={activity.id}
                  onPress={onSelectActivity ? () => onSelectActivity(activity) : undefined}
                  showDivider={index < activities.length - 1}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerSpacer: {
    width: 40,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.lg,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
