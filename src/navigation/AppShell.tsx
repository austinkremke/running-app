import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomAppBar } from '../components/app-bar';
import {
  AppHeader,
  HeaderIconButton,
  ProfileAvatarButton,
  TabAppHeader,
} from '../components/header';
import { useAuth, useOnboarding } from '../context';
import type { FeedTab, MatchTab } from '../mock';
import { initialsFromDisplayName } from '../services/profileAvatar';
import { FeedScreen } from '../screens/FeedScreen';
import { MatchScreen } from '../screens/MatchScreen';
import { MeScreen } from '../screens/MeScreen';
import { RunScreen } from '../screens/RunScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SoloMatchScreen } from '../screens/SoloMatchScreen';
import { TeamMatchScreen } from '../screens/TeamMatchScreen';
import { TeamScreen } from '../screens/TeamScreen';
import { TopTeamsScreen } from '../screens/TopTeamsScreen';
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
  const { shouldOpenSoloMatch, consumeSoloMatchNavigation } = useOnboarding();
  const [activeRoute, setActiveRoute] = useState<AppRoute>('feed');
  const [runReturnRoute, setRunReturnRoute] = useState<AppRoute>('feed');
  const [settingsReturnRoute, setSettingsReturnRoute] = useState<AppRoute>('me');
  const [activeFeedTab, setActiveFeedTab] = useState<FeedTab>('community');
  const [activeMatchTab, setActiveMatchTab] = useState<MatchTab>('team');

  useEffect(() => {
    if (!shouldOpenSoloMatch) {
      return;
    }

    setActiveRoute('soloMatch');
    setActiveMatchTab('solo');
    consumeSoloMatchNavigation();
  }, [consumeSoloMatchNavigation, shouldOpenSoloMatch]);

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

  function handleNavPress(key: string) {
    if (!isAppRoute(key)) {
      return;
    }

    if (key === 'run') {
      openRun();
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
      return <FeedScreen activeTab={activeFeedTab} />;
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
      return <TeamMatchScreen onRunPress={openRun} />;
    }

    if (activeRoute === 'soloMatch') {
      return <SoloMatchScreen onRunPress={openRun} />;
    }

    if (activeRoute === 'team') {
      return <TeamScreen onOpenTopTeams={() => setActiveRoute('topTeams')} />;
    }

    if (activeRoute === 'topTeams') {
      return <TopTeamsScreen />;
    }

    if (activeRoute === 'me') {
      return <MeScreen onOpenSettings={() => openSettings('me')} />;
    }

    if (activeRoute === 'settings') {
      return <SettingsScreen onBack={() => setActiveRoute(settingsReturnRoute)} />;
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
        onPress={() => {}}
        showBadge
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
            onPress={() => {}}
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

    if (activeRoute === 'me' || activeRoute === 'team') {
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
          onItemPress={handleNavPress}
        />
      ) : null}
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
