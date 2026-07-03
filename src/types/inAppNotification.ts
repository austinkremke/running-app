import type { ReactNode } from 'react';

import type { ChallengeFriend } from '../mock';

export type InAppNotificationAction = {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'danger';
};

export type InAppNotificationBase = {
  id: string;
  eyebrow?: string;
  title: string;
  message?: string;
  avatarUrl?: string;
  avatarFallbackLabel?: string;
  meta?: string;
  detail?: ReactNode;
  primaryAction?: InAppNotificationAction;
  secondaryAction?: InAppNotificationAction;
  heightRatio?: number;
  onDismiss?: () => void;
};

export type SoloChallengeInAppNotification = InAppNotificationBase & {
  kind: 'solo_challenge';
  challengeId: string;
  challenger: ChallengeFriend;
};

export type GenericInAppNotification = InAppNotificationBase & {
  kind: 'generic';
  body?: ReactNode;
  footer?: ReactNode;
};

export type InAppNotification = SoloChallengeInAppNotification | GenericInAppNotification;

export type InAppNotificationHandlers = {
  onSoloChallengeAccepted?: (matchId: string) => void;
};
