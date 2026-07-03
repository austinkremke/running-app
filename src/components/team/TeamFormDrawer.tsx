import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { TeamLogoAccent } from '../../mock';
import { colors, spacing } from '../../theme';
import { BottomSheetDrawer } from '../drawer';
import { TeamLogo } from './TeamLogo';
import { getTeamLogoAccentColor } from './teamLogoTheme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const LOGO_ICONS: IoniconsName[] = [
  'paw',
  'footsteps',
  'flash',
  'flame',
  'rocket',
  'skull',
  'shield-half',
  'thunderstorm',
];

const LOGO_ACCENTS: TeamLogoAccent[] = ['lime', 'purple', 'gold', 'silver', 'cyan', 'blue'];

export type TeamFormValues = {
  name: string;
  tag: string;
  motto: string;
  logoIcon: string;
  logoAccent: TeamLogoAccent;
};

type TeamFormDrawerProps = {
  visible: boolean;
  /** Edit mode hides the tag field (tags are immutable) and prefills values. */
  mode: 'create' | 'edit';
  initialValues?: Partial<TeamFormValues>;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: TeamFormValues) => void;
};

export function TeamFormDrawer({
  visible,
  mode,
  initialValues,
  submitting = false,
  onClose,
  onSubmit,
}: TeamFormDrawerProps) {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [motto, setMotto] = useState('');
  const [logoIcon, setLogoIcon] = useState<string>('paw');
  const [logoAccent, setLogoAccent] = useState<TeamLogoAccent>('lime');

  useEffect(() => {
    if (visible) {
      setName(initialValues?.name ?? '');
      setTag(initialValues?.tag ?? '');
      setMotto(initialValues?.motto ?? '');
      setLogoIcon(initialValues?.logoIcon ?? 'paw');
      setLogoAccent(initialValues?.logoAccent ?? 'lime');
    }
    // Reset only when the drawer opens; initialValues identity may change per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const canSubmit =
    name.trim().length >= 3 && (mode === 'edit' || /^[A-Za-z0-9]{2,5}$/.test(tag.trim()));

  return (
    <BottomSheetDrawer
      footer={
        <Pressable
          accessibilityLabel={mode === 'create' ? 'Create team' : 'Save team'}
          accessibilityRole="button"
          disabled={submitting || !canSubmit}
          onPress={() => {
            onSubmit({
              name: name.trim(),
              tag: tag.trim().toUpperCase(),
              motto: motto.trim(),
              logoIcon,
              logoAccent,
            });
          }}
          style={({ pressed }) => [
            styles.submitButton,
            (submitting || !canSubmit) && styles.submitButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.submitLabel}>
              {mode === 'create' ? 'Create Team' : 'Save Changes'}
            </Text>
          )}
        </Pressable>
      }
      heightRatio={0.78}
      keyboardAvoiding
      onClose={onClose}
      visible={visible}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <Text style={styles.title}>{mode === 'create' ? 'Create a Team' : 'Edit Team'}</Text>

          <View style={styles.previewRow}>
            <TeamLogo accent={logoAccent} icon={logoIcon as IoniconsName} size={56} />
            <View style={styles.previewMeta}>
              <Text numberOfLines={1} style={styles.previewName}>
                {name.trim() || 'Team name'}
              </Text>
              <Text style={styles.previewTag}>
                {(mode === 'edit' ? initialValues?.tag : tag.trim().toUpperCase()) || 'TAG'}
              </Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              editable={!submitting}
              maxLength={24}
              onChangeText={setName}
              placeholder="3-24 characters"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={name}
            />
          </View>

          {mode === 'create' ? (
            <View style={styles.field}>
              <Text style={styles.label}>Tag</Text>
              <TextInput
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!submitting}
                maxLength={5}
                onChangeText={(next) => setTag(next.toUpperCase())}
                placeholder="2-5 letters or numbers"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                value={tag}
              />
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Motto</Text>
            <TextInput
              editable={!submitting}
              maxLength={80}
              onChangeText={setMotto}
              placeholder="Optional"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={motto}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Logo</Text>
            <View style={styles.optionRow}>
              {LOGO_ICONS.map((icon) => (
                <Pressable
                  accessibilityLabel={`Logo ${icon}`}
                  accessibilityRole="button"
                  key={icon}
                  onPress={() => setLogoIcon(icon)}
                  style={[styles.iconOption, logoIcon === icon && styles.iconOptionSelected]}
                >
                  <Ionicons
                    color={logoIcon === icon ? colors.accentLime : colors.textSecondary}
                    name={icon}
                    size={20}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Accent</Text>
            <View style={styles.optionRow}>
              {LOGO_ACCENTS.map((accent) => (
                <Pressable
                  accessibilityLabel={`Accent ${accent}`}
                  accessibilityRole="button"
                  key={accent}
                  onPress={() => setLogoAccent(accent)}
                  style={[
                    styles.accentOption,
                    { backgroundColor: getTeamLogoAccentColor(accent) },
                    logoAccent === accent && styles.accentOptionSelected,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </BottomSheetDrawer>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewMeta: {
    flex: 1,
    gap: 2,
  },
  previewName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  previewTag: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 14,
    backgroundColor: colors.background,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  iconOptionSelected: {
    borderColor: colors.accentLime,
  },
  accentOption: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  accentOptionSelected: {
    borderWidth: 2,
    borderColor: colors.textPrimary,
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentLime,
    borderRadius: 12,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitLabel: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.85,
  },
});
