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

  const { title, screen: RouteScreen, showFeedTabs } = ROUTES[activeRoute];

  function handleNavPress(key: string) {
    if (isAppRoute(key)) {
      setActiveRoute(key);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.shell}>
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

        {activeRoute === 'feed' ? (
          <FeedScreen activeTab={activeFeedTab} />
        ) : RouteScreen ? (
          <RouteScreen />
        ) : null}
      </View>

      <BottomAppBar activeKey={activeRoute} onItemPress={handleNavPress} />
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
