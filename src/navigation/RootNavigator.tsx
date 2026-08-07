import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { BottomAppBar } from '../components/app-bar';
import { NotificationCenterDrawer } from '../components/notification';
import {
  useAuth,
  useInAppNotification,
  useNotificationCenter,
  useOnboarding,
  InAppNotificationProvider,
  NotificationCenterProvider,
  SoloMatchCompletionProvider,
  TeamMatchCompletionProvider,
} from '../context';
import { useMatchTabIndicators } from '../hooks/useHasActiveMatch';
import { OnboardingTermsScreen } from '../screens/onboarding';
import { AuthLoadingScreen } from '../screens/onboarding/AuthLoadingScreen';
import { fetchActiveSoloMatchId, fetchActiveTeamMatchId } from '../services/matchService';
import { getSoloMatchmakingStatus } from '../services/matchmakingService';
import { RootStack } from './RootStack';
import { OnboardingShell } from './OnboardingShell';
import type { RootStackParamList } from './types';

const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Pushed/full-screen routes render their own chrome (or none) — the shared
 *  bottom bar hides on these, matching the old `hideChrome` route config. */
const HIDDEN_BAR_ROUTES = new Set([
  'Run',
  'RunDetail',
  'TeamDetail',
  'UserProfile',
  'BlockedUsers',
  'DevSoloMatchScreenshot',
  'DevTeamScreenshot',
  'DevRankMedal',
]);

/** Folds pushed routes back onto their tab root for bottom-bar highlighting
 *  — mirrors the old AppShell activeKey computation. */
const ROUTE_TO_TAB_KEY: Record<string, string> = {
  Feed: 'feed',
  Match: 'match',
  Team: 'team',
  Me: 'me',
  TeamMatch: 'match',
  SoloMatch: 'match',
  Settings: 'me',
};

function AppChrome() {
  const userId = useAuth().session?.user?.id ?? null;
  const { showMatchTabBadge } = useMatchTabIndicators();
  const { registerHandlers } = useInAppNotification();
  const { notifications, loading, actionLoadingId, hasUnread, respond, visible, close } =
    useNotificationCenter();
  const [currentRouteName, setCurrentRouteName] = useState<string | undefined>('Feed');

  useEffect(() => {
    registerHandlers({
      onSoloChallengeAccepted: () => {
        if (navigationRef.isReady()) {
          navigationRef.navigate('MainTabs', { screen: 'Match' });
          navigationRef.navigate('SoloMatch', {});
        }
      },
    });
  }, [registerHandlers]);

  const handleNavPress = useCallback(
    (key: string) => {
      if (!navigationRef.isReady()) return;

      if (key === 'run') {
        navigationRef.navigate('Run');
        return;
      }

      if (key === 'match') {
        navigationRef.navigate('MainTabs', { screen: 'Match' });

        if (!userId) return;

        void (async () => {
          try {
            const [soloMatchId, matchmakingStatus, teamMatchId] = await Promise.all([
              fetchActiveSoloMatchId(userId, { skipFinalize: true }),
              getSoloMatchmakingStatus(),
              fetchActiveTeamMatchId(userId),
            ]);
            const hasSoloMatchInProgress =
              soloMatchId != null ||
              matchmakingStatus.status === 'in_match' ||
              matchmakingStatus.status === 'matched';

            if (hasSoloMatchInProgress) {
              navigationRef.navigate('SoloMatch', {});
              return;
            }

            if (teamMatchId != null) {
              navigationRef.navigate('TeamMatch', {});
            }
          } catch {
            // Stay on the match hub when status cannot be loaded.
          }
        })();
        return;
      }

      if (key === 'feed' || key === 'team' || key === 'me') {
        const screen = key === 'feed' ? 'Feed' : key === 'team' ? 'Team' : 'Me';
        navigationRef.navigate('MainTabs', { screen });
      }
    },
    [userId],
  );

  const showBar = !HIDDEN_BAR_ROUTES.has(currentRouteName ?? 'Feed');
  const activeKey = ROUTE_TO_TAB_KEY[currentRouteName ?? 'Feed'] ?? 'feed';

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => setCurrentRouteName(navigationRef.getCurrentRoute()?.name)}
        onStateChange={() => setCurrentRouteName(navigationRef.getCurrentRoute()?.name)}
      >
        <RootStack />
      </NavigationContainer>

      {showBar ? (
        <BottomAppBar
          activeKey={activeKey}
          badges={{ match: showMatchTabBadge, feed: hasUnread }}
          onItemPress={handleNavPress}
        />
      ) : null}

      <NotificationCenterDrawer
        actionLoadingId={actionLoadingId}
        loading={loading}
        notifications={notifications}
        onClose={close}
        onRespond={(notification, accept) => {
          void (async () => {
            try {
              await respond(notification, accept);
            } catch (error) {
              console.warn('Could not respond to team notification', error);
            }
          })();
        }}
        visible={visible}
      />
    </View>
  );
}

export function RootNavigator() {
  const { session, gameState, loading: authLoading, acceptTerms } = useAuth();
  const { hasCompletedOnboarding, onboardingReady, step } = useOnboarding();

  if (authLoading || (session && !onboardingReady)) {
    return <AuthLoadingScreen />;
  }

  if (!session || !hasCompletedOnboarding) {
    const preAuthStep = step === 'welcome' || step === 'login';
    return <OnboardingShell step={session && preAuthStep ? 'howItWorks' : step} />;
  }

  // Real, server-recorded gate — covers both brand-new accounts (who just
  // saw the informational pre-auth terms screen, but hadn't authenticated
  // yet to actually record acceptance) and pre-existing accounts that
  // authenticated before this gate existed. Blocks the app shell either way
  // until `accept_terms()` has actually run for this user.
  if (!gameState) {
    return <AuthLoadingScreen />;
  }

  if (!gameState.profile.terms_accepted_at) {
    return (
      <OnboardingTermsScreen
        onAccept={() => {
          void acceptTerms();
        }}
      />
    );
  }

  return (
    <InAppNotificationProvider>
      <NotificationCenterProvider>
        <SoloMatchCompletionProvider>
          <TeamMatchCompletionProvider>
            <AppChrome />
          </TeamMatchCompletionProvider>
        </SoloMatchCompletionProvider>
      </NotificationCenterProvider>
    </InAppNotificationProvider>
  );
}
