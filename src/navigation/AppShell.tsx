import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomAppBar } from '../components/app-bar';
import {
  AppHeader,
  HeaderIconButton,
  ProfileAvatarButton,
  TabAppHeader,
} from '../components/header';
import type { FeedTab } from '../mock';
import { FeedScreen } from '../screens/FeedScreen';
import { RunScreen } from '../screens/RunScreen';
import { colors } from '../theme';
import { isAppRoute, ROUTES, type AppRoute } from './routes';

const FEED_TABS = [
  { key: 'community', label: 'COMMUNITY' },
  { key: 'friends', label: 'FRIENDS' },
  { key: 'team', label: 'TEAM' },
] as const;

export function AppShell() {
  const [activeRoute, setActiveRoute] = useState<AppRoute>('feed');
  const [activeFeedTab, setActiveFeedTab] = useState<FeedTab>('community');

  const { title, screen: RouteScreen, showFeedTabs, hideChrome } = ROUTES[activeRoute];

  function handleNavPress(key: string) {
    if (isAppRoute(key)) {
      setActiveRoute(key);
    }
  }

  function renderScreen() {
    if (activeRoute === 'feed') {
      return <FeedScreen activeTab={activeFeedTab} />;
    }

    if (activeRoute === 'run') {
      return <RunScreen onBack={() => setActiveRoute('feed')} />;
    }

    return RouteScreen ? <RouteScreen /> : null;
  }

  return (
    <View style={styles.root}>
      <View style={styles.shell}>
        {!hideChrome ? (
          <>
            <AppHeader
              left={
                <HeaderIconButton
                  accessibilityLabel="Notifications"
                  icon="notifications-outline"
                  onPress={() => {}}
                  showBadge
                />
              }
              right={<ProfileAvatarButton initials="AK" onPress={() => {}} />}
              title={title}
            />

            {showFeedTabs ? (
              <TabAppHeader
                activeTab={activeFeedTab}
                onTabPress={(key) => setActiveFeedTab(key as FeedTab)}
                tabs={[...FEED_TABS]}
              />
            ) : null}
          </>
        ) : null}

        {renderScreen()}
      </View>

      {!hideChrome ? <BottomAppBar activeKey={activeRoute} onItemPress={handleNavPress} /> : null}
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
});
