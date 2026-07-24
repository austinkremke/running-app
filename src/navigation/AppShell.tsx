import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
// Alert kept for Level 10 Boost promo CTA when re-enabled
// import { Alert, StyleSheet, View } from 'react-native';

import { BottomAppBar } from '../components/app-bar';
import {
  AppHeader,
  HeaderIconButton,
  ProfileAvatarButton,
  TabAppHeader,
} from '../components/header';
import { NotificationCenterDrawer } from '../components/notification';
// import { PromoCard } from '../components/promo';
import {
  useAuth,
  useSoloMatchCompletion,
  useTeamMatchCompletion,
  useUserId,
  useInAppNotification,
  // usePromoOffer,
} from '../context';
import { useMatchTabIndicators } from '../hooks/useHasActiveMatch';
// import { useLevelGateProgress } from '../hooks/useLevelGateProgress';
import { useTeamNotifications } from '../hooks/useTeamNotifications';
import type { FeedTab, MatchTab, Run } from '../mock';
import { triggerMatchDetailShare } from '../services/matchDetailShareBus';
import { initialsFromDisplayName } from '../services/profileAvatar';
import { openSoloMatchMenu } from '../services/soloMatchMenuBus';
import { openTeamMenu } from '../services/teamMenuBus';
import { fetchActiveSoloMatchId, fetchActiveTeamMatchId } from '../services/matchService';
import { getSoloMatchmakingStatus } from '../services/matchmakingService';
import { DevSoloMatchScreenshotScreen } from '../screens/DevSoloMatchScreenshotScreen';
import { DevTeamScreenshotScreen } from '../screens/DevTeamScreenshotScreen';
import { FeedScreen } from '../screens/FeedScreen';
import { LeaderboardsScreen } from '../screens/LeaderboardsScreen';
import { RunDetailScreen } from '../screens/RunDetailScreen';
import { MatchScreen } from '../screens/MatchScreen';
import { MeScreen } from '../screens/MeScreen';
import { PublicTeamScreen } from '../screens/PublicTeamScreen';
import { RunScreen } from '../screens/RunScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SoloMatchScreen } from '../screens/SoloMatchScreen';
import { TeamMatchScreen } from '../screens/TeamMatchScreen';
import { TeamScreen } from '../screens/TeamScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { colors } from '../theme';
import { isAppRoute, ROUTES, type AppRoute } from './routes';

const SOCIAL_TABS = [
  { key: 'feed', label: 'FEED' },
  { key: 'leaderboards', label: 'LEADERBOARDS' },
] as const;

type SocialTab = (typeof SOCIAL_TABS)[number]['key'];

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
  // Level 10 Boost promo temporarily disabled
  // const { activeOffer, dismiss: dismissPromoOffer } = usePromoOffer();
  // The Level 10 Boost offer is currently the only promo, so this ties its
  // progress bar to the create_team gate specifically — once there are
  // multiple offers, this should move onto the PromoOffer object itself
  // (e.g. an optional gateFeatureId field) instead of being hardcoded here.
  // const levelBoostProgress = useLevelGateProgress('create_team');
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
  const [activeSocialTab, setActiveSocialTab] = useState<SocialTab>('feed');
  const [activeMatchTab, setActiveMatchTab] = useState<MatchTab>('team');
  const [detailRun, setDetailRun] = useState<Run | null>(null);
  const [detailReturnRoute, setDetailReturnRoute] = useState<AppRoute>('feed');
  const [feedReloadKey, setFeedReloadKey] = useState(0);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [profileReturnRoute, setProfileReturnRoute] = useState<AppRoute>('feed');
  const [detailMatchId, setDetailMatchId] = useState<string | null>(null);
  const [matchDetailReturnRoute, setMatchDetailReturnRoute] = useState<AppRoute>('feed');
  const [detailTeamId, setDetailTeamId] = useState<string | null>(null);
  const [teamDetailReturnRoute, setTeamDetailReturnRoute] = useState<AppRoute>('feed');

  function openTeamDetail(teamId: string) {
    setDetailTeamId(teamId);
    setTeamDetailReturnRoute(activeRoute === 'teamDetail' ? teamDetailReturnRoute : activeRoute);
    setActiveRoute('teamDetail');
  }

  function openRunDetail(run: Run) {
    setDetailRun(run);
    setDetailReturnRoute(activeRoute === 'runDetail' ? detailReturnRoute : activeRoute);
    setActiveRoute('runDetail');
  }

  function openSoloMatchDetail(matchId: string) {
    setDetailMatchId(matchId);
    setMatchDetailReturnRoute(activeRoute === 'soloMatchDetail' ? matchDetailReturnRoute : activeRoute);
    setActiveRoute('soloMatchDetail');
  }

  function openTeamMatchDetail(matchId: string) {
    setDetailMatchId(matchId);
    setMatchDetailReturnRoute(activeRoute === 'teamMatchDetail' ? matchDetailReturnRoute : activeRoute);
    setActiveRoute('teamMatchDetail');
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
      if (activeSocialTab === 'leaderboards') {
        return <LeaderboardsScreen onOpenProfile={openUserProfile} onOpenTeam={openTeamDetail} />;
      }

      return (
        <FeedScreen
          activeTab={activeFeedTab}
          key={feedReloadKey}
          onOpenProfile={openUserProfile}
          onOpenRun={openRunDetail}
          onOpenSoloMatch={openSoloMatchDetail}
          onOpenTeamMatch={openTeamMatchDetail}
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

    if (activeRoute === 'teamMatchDetail' && detailMatchId) {
      return <TeamMatchScreen matchId={detailMatchId} onOpenRunDetail={openRunDetail} />;
    }

    if (activeRoute === 'soloMatchDetail' && detailMatchId) {
      return <SoloMatchScreen matchId={detailMatchId} onOpenRunDetail={openRunDetail} />;
    }

    if (activeRoute === 'team') {
      return (
        <TeamScreen
          onOpenProfile={openUserProfile}
          onOpenRun={openRunDetail}
          onOpenLeaderboards={() => {
            setActiveSocialTab('leaderboards');
            setActiveRoute('feed');
          }}
          onViewAllActivity={() => {
            setActiveSocialTab('feed');
            setActiveFeedTab('team');
            setActiveRoute('feed');
          }}
        />
      );
    }

    if (activeRoute === 'teamDetail' && detailTeamId) {
      return (
        <PublicTeamScreen
          onBack={() => setActiveRoute(teamDetailReturnRoute)}
          onOpenProfile={openUserProfile}
          teamId={detailTeamId}
        />
      );
    }

    if (activeRoute === 'me') {
      return (
        <MeScreen
          onOpenDevScreenshotMock={__DEV__ ? () => setActiveRoute('devSoloMatchScreenshot') : undefined}
          onOpenDevTeamScreenshotMock={__DEV__ ? () => setActiveRoute('devTeamScreenshot') : undefined}
          onOpenMatch={openSoloMatchDetail}
          onOpenRun={openRunDetail}
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
    if (
      activeRoute === 'match' ||
      activeRoute === 'teamMatch' ||
      activeRoute === 'soloMatch' ||
      activeRoute === 'teamMatchDetail' ||
      activeRoute === 'soloMatchDetail' ||
      activeRoute === 'settings'
    ) {
      return (
        <HeaderIconButton
          accessibilityLabel="Go back"
          icon="chevron-back"
          onPress={() => {
            if (activeRoute === 'settings') {
              setActiveRoute(settingsReturnRoute);
              return;
            }

            if (activeRoute === 'teamMatchDetail' || activeRoute === 'soloMatchDetail') {
              setDetailMatchId(null);
              setActiveRoute(matchDetailReturnRoute);
              return;
            }

            if (activeRoute === 'teamMatch' || activeRoute === 'soloMatch') {
              setActiveRoute('match');
              if (activeRoute === 'soloMatch') {
                setActiveMatchTab('solo');
              }
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

    if (activeRoute === 'teamMatchDetail' || activeRoute === 'soloMatchDetail') {
      return (
        <HeaderIconButton
          accessibilityLabel="Share match"
          icon="share-outline"
          onPress={triggerMatchDetailShare}
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
                accentActive
                activeTab={activeSocialTab}
                compact
                onTabPress={(key) => setActiveSocialTab(key as SocialTab)}
                tabs={[...SOCIAL_TABS]}
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

      {/* Level 10 Boost promo temporarily disabled
      {!hideChrome && activeOffer ? (
        <PromoCard
          ctaLabel={activeOffer.ctaLabel}
          description={activeOffer.description}
          icon={activeOffer.icon}
          onDismiss={dismissPromoOffer}
          onPressCta={() => {
            Alert.alert('Coming soon', 'Purchases are not wired up yet.');
          }}
          progress={
            levelBoostProgress
              ? {
                  ratio: levelBoostProgress.ratio,
                  label: `~${levelBoostProgress.estimatedRuns} more run${levelBoostProgress.estimatedRuns === 1 ? '' : 's'} to level ${levelBoostProgress.minLevel}`,
                }
              : undefined
          }
          title={activeOffer.title}
        />
      ) : null}
      */}

      {!hideChrome ? (
        <BottomAppBar
          activeKey={
            activeRoute === 'settings'
              ? settingsReturnRoute === 'team'
                ? 'team'
                : 'me'
              : activeRoute === 'teamMatch' || activeRoute === 'soloMatch'
                ? 'match'
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
