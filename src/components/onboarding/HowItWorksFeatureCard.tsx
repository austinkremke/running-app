import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { RunnerIcon } from '../icons/RunnerIcon';
import { colors, spacing } from '../../theme';

type HowItWorksFeatureCardProps = {
  title: string;
  description: string;
  icon: 'match' | 'run' | 'levelUp' | 'teams';
  variant?: 'accent' | 'muted';
};

export function HowItWorksFeatureCard({
  title,
  description,
  icon,
  variant = 'accent',
}: HowItWorksFeatureCardProps) {
  const isMuted = variant === 'muted';
  const accentColor = isMuted ? colors.textSecondary : colors.accentLime;
  const titleColor = isMuted ? colors.textSecondary : colors.accentLime;
  const bodyColor = isMuted ? colors.textSecondary : colors.textPrimary;

  return (
    <View style={[styles.card, isMuted ? styles.cardMuted : styles.cardAccent]}>
      <View style={[styles.iconWrap, { borderColor: accentColor }]}>
        <FeatureIcon color={accentColor} icon={icon} />
      </View>

      <View style={styles.copy}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        <Text style={[styles.description, { color: bodyColor }]}>{description}</Text>
      </View>
    </View>
  );
}

function FeatureIcon({ icon, color }: { icon: HowItWorksFeatureCardProps['icon']; color: string }) {
  switch (icon) {
    case 'match':
      return (
        <View style={styles.matchIcon}>
          <Ionicons color={color} name="locate-outline" size={22} />
          <View style={styles.matchPeople}>
            <Ionicons color={color} name="person" size={8} />
            <Ionicons color={color} name="person" size={8} />
          </View>
        </View>
      );
    case 'run':
      return <RunnerIcon color={color} size={22} />;
    case 'levelUp':
      return (
        <View style={styles.levelIcon}>
          <Ionicons color={color} name="chevron-up" size={12} />
          <Ionicons color={color} name="chevron-up" size={14} />
          <Ionicons color={color} name="chevron-up" size={16} />
        </View>
      );
    case 'teams':
      return <TeamsIcon color={color} />;
  }
}

function TeamsIcon({ color }: { color: string }) {
  return (
    <View style={styles.teamsIcon}>
      <View style={styles.teamsPeople}>
        <Ionicons color={color} name="person" size={9} />
        <Ionicons color={color} name="person" size={9} />
        <Ionicons color={color} name="person" size={9} />
      </View>
      <Ionicons color={color} name="shield" size={16} style={styles.teamsShield} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardAccent: {
    backgroundColor: colors.surface,
    borderColor: colors.accentLime,
  },
  cardMuted: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.6,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
  },
  matchIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchPeople: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 1,
    bottom: 8,
  },
  levelIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamsIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  teamsPeople: {
    flexDirection: 'row',
    gap: 1,
    marginBottom: -6,
  },
  teamsShield: {
    marginTop: -2,
  },
});
