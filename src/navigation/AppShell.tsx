import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomAppBar } from '../components/app-bar';
import {
  AppHeader,
  HeaderIconButton,
  ProfileAvatarButton,
  TabAppHeader,
} from '../components/header';
import type { FeedTab, MatchTab } from '../mock';
import { FeedScreen } from '../screens/FeedScreen';
import { MatchScreen } from '../screens/MatchScreen';
import { RunScreen } from '../screens/RunScreen';
import { TeamMatchScreen } from '../screens/TeamMatchScreen';
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
  const [activeRoute, setActiveRoute] = useState<AppRoute>('feed');
  const [runReturnRoute, setRunReturnRoute] = useState<AppRoute>('feed');
  const [activeFeedTab, setActiveFeedTab] = useState<FeedTab>('community');
  const [activeMatchTab, setActiveMatchTab] = useState<MatchTab>('team');

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

  function renderScreen() {
    if (activeRoute === 'feed') {
      return <FeedScreen activeTab={activeFeedTab} />;
    }

    if (activeRoute === 'run') {
      return <RunScreen onBack={() => setActiveRoute(runReturnRoute)} />;
    }

    if (activeRoute === 'match') {
      return <MatchScreen activeTab={activeMatchTab} onOpenTeamMatch={() => setActiveRoute('teamMatch')} />;
    }

    if (activeRoute === 'teamMatch') {
      return <TeamMatchScreen onRunPress={openRun} />;
    }

    return RouteScreen ? <RouteScreen /> : null;
  }

  function renderHeaderLeft() {
    if (activeRoute === 'match' || activeRoute === 'teamMatch') {
      return (
        <HeaderIconButton
          accessibilityLabel="Go back"
          icon="chevron-back"
          onPress={() => setActiveRoute(activeRoute === 'teamMatch' ? 'match' : 'feed')}
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
          onPress={() => {}}
        />
      );
    }

    return <ProfileAvatarButton initials="AK" onPress={() => {}} />;
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
          activeKey={activeRoute === 'teamMatch' ? 'match' : activeRoute}
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
