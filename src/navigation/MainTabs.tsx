import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, HeaderIconButton, ProfileAvatarButton, TabAppHeader } from '../components/header';
import { useAuth, useNotificationCenter, useSoloMatchCompletion, useTeamMatchCompletion } from '../context';
import { useMatchTabIndicators } from '../hooks/useHasActiveMatch';
import { SoloMatchTab, TeamMatchTab } from '../components/match';
import type { FeedTab, MatchTab } from '../mock';
import { FeedScreen } from '../screens/FeedScreen';
import { LeaderboardsScreen } from '../screens/LeaderboardsScreen';
import { MeScreen } from '../screens/MeScreen';
import { TeamScreen } from '../screens/TeamScreen';
import { initialsFromDisplayName } from '../services/profileAvatar';
import { openTeamMenu } from '../services/teamMenuBus';
import { colors } from '../theme';
import type { MainTabParamList, RootStackParamList } from './types';
import { useOpenProfile } from './useOpenProfile';

const SOCIAL_TABS = [
  { key: 'feed', label: 'FEED' },
  { key: 'leaderboards', label: 'LEADERBOARDS' },
] as const;

const MATCH_TABS = [
  { key: 'team', label: 'Team' },
  { key: 'solo', label: 'Solo' },
] as const;

type RootNav = NativeStackNavigationProp<RootStackParamList>;

function FeedTabScreen() {
  const navigation = useNavigation<RootNav>();
  const route = useRoute<RouteProp<MainTabParamList, 'Feed'>>();
  const { gameState } = useAuth();
  const { hasUnread, open } = useNotificationCenter();
  const openProfile = useOpenProfile();
  const [activeSocialTab, setActiveSocialTab] = useState(route.params?.initialSocialTab ?? 'feed');
  const [activeFeedTab, setActiveFeedTab] = useState<FeedTab>(route.params?.initialFeedTab ?? 'community');

  useEffect(() => {
    if (route.params?.initialSocialTab) setActiveSocialTab(route.params.initialSocialTab);
    if (route.params?.initialFeedTab) setActiveFeedTab(route.params.initialFeedTab);
  }, [route.params?.initialFeedTab, route.params?.initialSocialTab]);

  return (
    <View style={styles.screen}>
      <AppHeader
        left={
          <HeaderIconButton
            accessibilityLabel="Notifications"
            icon="notifications-outline"
            onPress={open}
            showBadge={hasUnread}
          />
        }
        right={
          <ProfileAvatarButton
            imageUri={gameState?.profile.avatar_url ?? undefined}
            initials={initialsFromDisplayName(gameState?.profile.display_name)}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Me' })}
          />
        }
        title="SOCIAL"
      />
      <TabAppHeader
        accentActive
        activeTab={activeSocialTab}
        compact
        onTabPress={(key) => setActiveSocialTab(key as typeof activeSocialTab)}
        tabs={[...SOCIAL_TABS]}
      />

      {activeSocialTab === 'leaderboards' ? (
        <LeaderboardsScreen
          onOpenProfile={openProfile}
          onOpenTeam={(teamId) => navigation.navigate('TeamDetail', { teamId })}
        />
      ) : (
        <FeedScreen
          activeTab={activeFeedTab}
          onOpenProfile={openProfile}
          onOpenRun={(run) => navigation.navigate('RunDetail', { run })}
          onOpenSoloMatch={(matchId) => navigation.navigate('SoloMatch', { matchId })}
          onOpenTeamMatch={(matchId) => navigation.navigate('TeamMatch', { matchId })}
        />
      )}
    </View>
  );
}

function MatchTabScreen() {
  const navigation = useNavigation<RootNav>();
  const { showSoloTabBadge } = useMatchTabIndicators();
  const { syncCompletions } = useSoloMatchCompletion();
  const { syncCompletions: syncTeamCompletions } = useTeamMatchCompletion();
  const [activeMatchTab, setActiveMatchTab] = useState<MatchTab>('team');

  useEffect(() => {
    void syncCompletions();
    void syncTeamCompletions();
  }, [syncCompletions, syncTeamCompletions]);

  return (
    <View style={styles.screen}>
      <AppHeader
        left={
          <HeaderIconButton
            accessibilityLabel="Go back"
            icon="chevron-back"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Feed' })}
          />
        }
        right={<HeaderIconButton accessibilityLabel="Help" icon="help-circle-outline" onPress={() => {}} />}
        title={activeMatchTab === 'solo' ? 'SOLO MATCH' : 'MATCHMAKING'}
      />
      <TabAppHeader
        activeTab={activeMatchTab}
        badges={showSoloTabBadge ? { solo: true } : undefined}
        onTabPress={(key) => setActiveMatchTab(key as MatchTab)}
        tabs={[...MATCH_TABS]}
      />

      {activeMatchTab === 'solo' ? (
        <SoloMatchTab onViewActiveMatch={() => navigation.navigate('SoloMatch', {})} />
      ) : (
        <TeamMatchTab onViewActiveMatch={() => navigation.navigate('TeamMatch', {})} />
      )}
    </View>
  );
}

function TeamTabScreen() {
  const navigation = useNavigation<RootNav>();
  const openProfile = useOpenProfile();

  return (
    <View style={styles.screen}>
      <AppHeader
        right={
          <HeaderIconButton accessibilityLabel="Team options" icon="ellipsis-vertical" onPress={openTeamMenu} />
        }
        showBorder
        title="TEAM"
      />
      <TeamScreen
        onOpenLeaderboards={() =>
          navigation.navigate('MainTabs', { screen: 'Feed', params: { initialSocialTab: 'leaderboards' } })
        }
        onOpenProfile={openProfile}
        onOpenRun={(run) => navigation.navigate('RunDetail', { run })}
        onViewAllActivity={() =>
          navigation.navigate('MainTabs', {
            screen: 'Feed',
            params: { initialSocialTab: 'feed', initialFeedTab: 'team' },
          })
        }
      />
    </View>
  );
}

function MeTabScreen() {
  const navigation = useNavigation<RootNav>();

  return (
    <View style={styles.screen}>
      <MeScreen
        onOpenDevRankMedalMock={__DEV__ ? () => navigation.navigate('DevRankMedal') : undefined}
        onOpenDevScreenshotMock={__DEV__ ? () => navigation.navigate('DevSoloMatchScreenshot') : undefined}
        onOpenDevTeamScreenshotMock={__DEV__ ? () => navigation.navigate('DevTeamScreenshot') : undefined}
        onOpenMatch={(matchId) => navigation.navigate('SoloMatch', { matchId })}
        onOpenRun={(run) => navigation.navigate('RunDetail', { run })}
        onOpenSettings={() => navigation.navigate('Settings')}
      />
    </View>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
      tabBar={() => null}
    >
      <Tab.Screen component={FeedTabScreen} name="Feed" />
      <Tab.Screen component={MatchTabScreen} name="Match" />
      <Tab.Screen component={TeamTabScreen} name="Team" />
      <Tab.Screen component={MeTabScreen} name="Me" />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
