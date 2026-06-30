import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const TIER_ICON_MAP: Record<string, IoniconsName> = {
  'shield-bronze': 'medal-outline',
  'shield-silver': 'ribbon-outline',
  'shield-gold': 'star-outline',
  'shield-elite': 'star',
  'shield-legend': 'trophy',
};

export function rankTierIconToIonicon(icon: string): IoniconsName {
  return TIER_ICON_MAP[icon] ?? 'shield-outline';
}
