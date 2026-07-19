import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomAppBar } from '../components/app-bar';
import {
  AppHeader,
  HeaderIconButton,
  ProfileAvatarButton,
  TabAppHeader,
} from '../components/header';
import { NotificationCenterDrawer } from '../components/notification';
import {
  useAuth,
  useSoloMatchCompletion,
  useTeamMatchCompletion,
  useUserId,
  useInAppNotification,
} from '../context';
import { useMatchTabIndicators } from '../hooks/useHasActiveMatch';
import { useTeamNotifications } from '../hooks/useTeamNotifications';
import type { FeedTab, MatchTab, Run } from '../mock';
import { initialsFromDisplayName } from '../services/profileAvatar';
import { openSoloMatchMenu } from '../services/soloMatchMenuBus';
import { openTeamMenu } from '../services/teamMenuBus';
import { fetchActiveSoloMatchId, fetchActiveTeamMatchId } from '../services/matchService';
import { getSoloMatchmakingStatus } from '../services/matchmakingService';
import { DevSoloMatchScreenshotScreen } from '../screens/DevSoloMatchScreenshotScreen';
import { DevTeamScreenshotScreen } from '../screens/DevTeamScreenshotScreen';
import { FeedScreen } from '../screens/FeedScreen';
import { RunDetailScreen } from '../screens/RunDetailScreen';
import { MatchScreen } from '../screens/MatchScreen';
import { MeScreen } from '../screens/MeScreen';
import { RunScreen } from '../screens/RunScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SoloMatchScreen } from '../screens/SoloMatchScreen';
import { TeamMatchScreen } from '../screens/TeamMatchScreen';
import { TeamScreen } from '../screens/TeamScreen';
import { TopTeamsScreen } from '../screens/TopTeamsScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { colors } from '../theme';
import { isAppRoute, ROUTES, type AppRoute } from './routes';

const FEED_TABS = [
  { key: 'community', label: 'COMMUNITY' },
  { key: 'friends', label: 'FRIENDS' },
  { key: 'team', label: 'TEAM' },
] as const;

const MATCH_TABS = [
  { key: 'team', label: 'Team' },
  { key: 'solo', label: 'Solo' },
] as const;

export function AppShell() {
  const { gameState } = useAuth();
  const userId = useUserId();
  const { syncCompletions } = useSoloMatchCompletion();
  const { syncCompletions: syncTeamCompletions } = useTeamMatchCompletion();
  const { showMatchTabBadge, showSoloTabBadge } = useMatchTabIndicators();
  const { registerHandlers } = useInAppNotification();
  const {
    notifications: teamNotifications,
    loading: teamNotificationsLoading,
    actionLoadingId: teamNotificationActionId,
    hasUnread: hasTeamNotifications,
    respond: respondToTeamNotification,
  } = useTeamNotifications();
  const [notificationCenterVisible, setNotificationCenterVisible] = useState(false);
  const [activeRoute, setActiveRoute] = useState<AppRoute>('feed');
  const [runReturnRoute, setRunReturnRoute] = useState<AppRoute>('feed');
  const [settingsReturnRoute, setSettingsReturnRoute] = useState<AppRoute>('me');
  const [activeFeedTab, setActiveFeedTab] = useState<FeedTab>('community');
  const [activeMatchTab, setActiveMatchTab] = useState<MatchTab>('team');
  const [detailRun, setDetailRun] = useState<Run | null>(null);
  const [detailReturnRoute, setDetailReturnRoute] = useState<AppRoute>('feed');
  const [feedReloadKey, setFeedReloadKey] = useState(0);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [profileReturnRoute, setProfileReturnRoute] = useState<AppRoute>('feed');

  function openRunDetail(run: Run) {
    setDetailRun(run);
    setDetailReturnRoute(activeRoute === 'runDetail' ? detailReturnRoute : activeRoute);
    setActiveRoute('runDetail');
  }

  function openUserProfile(profileUserId: string) {
    if (profileUserId === userId) {
      setActiveRoute('me');
      return;
    }

    setDetailUserId(profileUserId);
    setProfileReturnRoute(activeRoute === 'userProfile' ? profileReturnRoute : activeRoute);
    setActiveRoute('userProfile');
  }

  useEffect(() => {
    registerHandlers({
      onSoloChallengeAccepted: () => {
        setActiveRoute('soloMatch');
        setActiveMatchTab('solo');
      },
    });
  }, [registerHandlers]);

  useEffect(() => {
    if (activeRoute === 'match' || activeRoute === 'soloMatch') {
      void syncCompletions();
    }

    if (activeRoute === 'match' || activeRoute === 'teamMatch') {
      void syncTeamCompletions();
    }
  }, [activeRoute, syncCompletions, syncTeamCompletions]);

  const {
    title,
    screen: RouteScreen,
    showFeedTabs,
    showMatchTabs,
    showHeaderBorder = !showFeedTabs && !showMatchTabs,
    hideChrome,
  } = ROUTES[activeRoute];

  const headerTitle =
    activeRoute === 'match'
      ? activeMatchTab === 'solo'
        ? 'SOLO MATCH'
        : 'MATCHMAKING'
      : activeRoute === 'teamMatch'
        ? 'MATCH'
        : activeRoute === 'topTeams'
          ? 'TOP TEAMS'
          : activeRoute === 'settings'
            ? 'SETTINGS'
            : title;

  function openRun() {
    if (activeRoute !== 'run') {
      setRunReturnRoute(activeRoute);
    }
    setActiveRoute('run');
  }

  function openMatchRoute() {
    setActiveRoute('match');

    if (!userId) {
      return;
    }

    void syncCompletions();

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
          setActiveRoute('soloMatch');
          setActiveMatchTab('solo');
          return;
        }

        if (teamMatchId != null) {
          setActiveRoute('teamMatch');
          setActiveMatchTab('team');
        }
      } catch {
        // Stay on the match hub when status cannot be loaded.
      }
    })();
  }

  function handleNavPress(key: string) {
    if (!isAppRoute(key)) {
      return;
    }

    if (key === 'run') {
      openRun();
      return;
    }

    if (key === 'match') {
      void openMatchRoute();
      return;
    }

    setActiveRoute(key);
  }

  function openSettings(from: AppRoute) {
    setSettingsReturnRoute(from);
    setActiveRoute('settings');
  }

  function renderScreen() {
    if (activeRoute === 'feed') {
      return (
        <FeedScreen
          activeTab={activeFeedTab}
          key={feedReloadKey}
          onOpenProfile={openUserProfile}
          onOpenRun={openRunDetail}
        />
      );
    }

    if (activeRoute === 'userProfile' && detailUserId) {
      return (
        <UserProfileScreen onBack={() => setActiveRoute(profileReturnRoute)} userId={detailUserId} />
      );
    }

    if (activeRoute === 'runDetail' && detailRun) {
      return (
        <RunDetailScreen
          onBack={() => setActiveRoute(detailReturnRoute)}
          onDeleted={() => {
            setFeedReloadKey((key) => key + 1);
            setActiveRoute(detailReturnRoute === 'runDetail' ? 'feed' : detailReturnRoute);
          }}
          run={detailRun}
        />
      );
    }

    if (activeRoute === 'run') {
      return <RunScreen onBack={() => setActiveRoute(runReturnRoute)} />;
    }

    if (activeRoute === 'match') {
      return (
        <MatchScreen
          activeTab={activeMatchTab}
          onOpenSoloMatch={() => setActiveRoute('soloMatch')}
          onOpenTeamMatch={() => setActiveRoute('teamMatch')}
        />
      );
    }

    if (activeRoute === 'teamMatch') {
      return <TeamMatchScreen onOpenRunDetail={openRunDetail} onRunPress={openRun} />;
    }

    if (activeRoute === 'soloMatch') {
      return (
        <SoloMatchScreen
          onOpenRunDetail={openRunDetail}
          onQuit={() => setActiveRoute('match')}
          onRunPress={openRun}
        />
      );
    }

    if (activeRoute === 'team') {
      return (
        <TeamScreen
          onOpenProfile={openUserProfile}
          onOpenRun={openRunDetail}
          onOpenTopTeams={() => setActiveRoute('topTeams')}
          onViewAllActivity={() => {
            setActiveFeedTab('team');
            setActiveRoute('feed');
          }}
        />
      );
    }

    if (activeRoute === 'topTeams') {
      return <TopTeamsScreen />;
    }

    if (activeRoute === 'me') {
      return (
        <MeScreen
          onOpenDevScreenshotMock={__DEV__ ? () => setActiveRoute('devSoloMatchScreenshot') : undefined}
          onOpenDevTeamScreenshotMock={__DEV__ ? () => setActiveRoute('devTeamScreenshot') : undefined}
          onOpenSettings={() => openSettings('me')}
        />
      );
    }

    if (activeRoute === 'settings') {
      return <SettingsScreen onBack={() => setActiveRoute(settingsReturnRoute)} />;
    }

    if (activeRoute === 'devSoloMatchScreenshot') {
      return <DevSoloMatchScreenshotScreen onBack={() => setActiveRoute('me')} />;
    }

    if (activeRoute === 'devTeamScreenshot') {
      return <DevTeamScreenshotScreen onBack={() => setActiveRoute('me')} />;
    }

    return RouteScreen ? <RouteScreen /> : null;
  }

  function renderHeaderLeft() {
    if (activeRoute === 'match' || activeRoute === 'teamMatch' || activeRoute === 'soloMatch' || activeRoute === 'topTeams' || activeRoute === 'settings') {
      return (
        <HeaderIconButton
          accessibilityLabel="Go back"
          icon="chevron-back"
          onPress={() => {
            if (activeRoute === 'settings') {
              setActiveRoute(settingsReturnRoute);
              return;
            }

            if (activeRoute === 'teamMatch' || activeRoute === 'soloMatch') {
              setActiveRoute('match');
              if (activeRoute === 'soloMatch') {
                setActiveMatchTab('solo');
              }
              return;
            }

            if (activeRoute === 'topTeams') {
              setActiveRoute('team');
              return;
            }

            setActiveRoute('feed');
          }}
        />
      );
    }

    if (activeRoute === 'me' || activeRoute === 'team') {
      return undefined;
    }

    return (
      <HeaderIconButton
        accessibilityLabel="Notifications"
        icon="notifications-outline"
        onPress={() => setNotificationCenterVisible(true)}
        showBadge={hasTeamNotifications}
      />
    );
  }

  function renderHeaderRight() {
    if (activeRoute === 'topTeams') {
      return (
        <HeaderIconButton
          accessibilityLabel="Top teams info"
          icon="information-circle-outline"
          onPress={() => {}}
        />
      );
    }

    if (activeRoute === 'soloMatch') {
      return (
        <View style={styles.headerActions}>
          <HeaderIconButton
            accessibilityLabel="Share match"
            icon="share-outline"
            onPress={() => {}}
          />
          <HeaderIconButton
            accessibilityLabel="More options"
            icon="ellipsis-vertical"
            onPress={openSoloMatchMenu}
          />
        </View>
      );
    }

    if (activeRoute === 'teamMatch') {
      return (
        <View style={styles.headerActions}>
          <HeaderIconButton
            accessibilityLabel="Team chat"
            icon="chatbubble-outline"
            onPress={() => {}}
          />
          <HeaderIconButton
            accessibilityLabel="More options"
            icon="ellipsis-vertical"
            onPress={() => {}}
          />
        </View>
      );
    }

    if (activeRoute === 'match') {
      return (
        <HeaderIconButton
          accessibilityLabel="Help"
          icon="help-circle-outline"
          onPress={() => {}}
        />
      );
    }

    if (activeRoute === 'team') {
      return (
        <HeaderIconButton
          accessibilityLabel="Team options"
          icon="ellipsis-vertical"
          onPress={openTeamMenu}
        />
      );
    }

    if (activeRoute === 'me') {
      return (
        <HeaderIconButton
          accessibilityLabel="Settings"
          icon="settings-outline"
          onPress={() => openSettings(activeRoute)}
        />
      );
    }

    return (
      <ProfileAvatarButton
        imageUri={gameState?.profile.avatar_url ?? undefined}
        initials={initialsFromDisplayName(gameState?.profile.display_name)}
        onPress={() => setActiveRoute('me')}
      />
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.shell}>
        {!hideChrome ? (
          <>
            <AppHeader
              left={renderHeaderLeft()}
              right={renderHeaderRight()}
              showBorder={showHeaderBorder}
              title={headerTitle}
            />

            {showFeedTabs ? (
              <TabAppHeader
                activeTab={activeFeedTab}
                onTabPress={(key) => setActiveFeedTab(key as FeedTab)}
                tabs={[...FEED_TABS]}
              />
            ) : null}

            {showMatchTabs ? (
              <TabAppHeader
                activeTab={activeMatchTab}
                badges={showSoloTabBadge ? { solo: true } : undefined}
                onTabPress={(key) => setActiveMatchTab(key as MatchTab)}
                tabs={[...MATCH_TABS]}
              />
            ) : null}
          </>
        ) : null}

        {renderScreen()}
      </View>

      {!hideChrome ? (
        <BottomAppBar
          activeKey={
            activeRoute === 'settings'
              ? settingsReturnRoute === 'team'
                ? 'team'
                : 'me'
              : activeRoute === 'teamMatch' || activeRoute === 'soloMatch'
                ? 'match'
                : activeRoute === 'topTeams'
                  ? 'team'
                  : activeRoute
          }
          badges={{ match: showMatchTabBadge, feed: hasTeamNotifications }}
          onItemPress={handleNavPress}
        />
      ) : null}

      <NotificationCenterDrawer
        actionLoadingId={teamNotificationActionId}
        loading={teamNotificationsLoading}
        notifications={teamNotifications}
        onClose={() => setNotificationCenterVisible(false)}
        onRespond={(notification, accept) => {
          void (async () => {
            try {
              await respondToTeamNotification(notification, accept);
            } catch (error) {
              console.warn('Could not respond to team notification', error);
            }
          })();
        }}
        visible={notificationCenterVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  shell: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
