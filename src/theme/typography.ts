import { TextStyle } from 'react-native';

import { colors } from './colors';

export const typography = {
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: colors.textPrimary,
  } satisfies TextStyle,
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  } satisfies TextStyle,
} as const;
