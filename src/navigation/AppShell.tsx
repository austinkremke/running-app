import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomAppBar } from '../components/app-bar';
import {
  AppHeader,
  HeaderIconButton,
  ProfileAvatarButton,
  TabAppHeader,
} from '../components/header';
import { colors } from '../theme';
import { isAppRoute, ROUTES, type AppRoute } from './routes';

const FEED_TABS = [
  { key: 'community', label: 'COMMUNITY' },
  { key: 'friends', label: 'FRIENDS' },
  { key: 'team', label: 'TEAM' },
] as const;

export function AppShell() {
  const [activeRoute, setActiveRoute] = useState<AppRoute>('feed');
  const [activeFeedTab, setActiveFeedTab] = useState('community');

  const { title, screen: Screen, showFeedTabs } = ROUTES[activeRoute];

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
            onTabPress={setActiveFeedTab}
            tabs={[...FEED_TABS]}
          />
        ) : null}

        <Screen />
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
