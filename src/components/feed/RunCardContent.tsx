import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';

type RunCardContentProps = {
  title: string;
  description: string;
};

export function RunCardContent({ title, description }: RunCardContentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
