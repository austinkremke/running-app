import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { lazy, Suspense } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader, HeaderIconButton } from '../components/header';
import { BlockedUsersScreen } from '../screens/BlockedUsersScreen';
import { DevSoloMatchScreenshotScreen } from '../screens/DevSoloMatchScreenshotScreen';
import { DevTeamScreenshotScreen } from '../screens/DevTeamScreenshotScreen';
import { PublicTeamScreen } from '../screens/PublicTeamScreen';
import { RunDetailScreen } from '../screens/RunDetailScreen';
import { RunScreen } from '../screens/RunScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SoloMatchScreen } from '../screens/SoloMatchScreen';
import { TeamMatchScreen } from '../screens/TeamMatchScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { triggerMatchDetailShare } from '../services/matchDetailShareBus';
import { openSoloMatchMenu } from '../services/soloMatchMenuBus';
import { colors } from '../theme';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';
import { useOpenProfile } from './useOpenProfile';

// Lazy — pulls in @react-three/fiber/three/expo-gl, which we don't want
// evaluated at app boot for every user just because this dev-only screen
// exists somewhere in the route table.
const DevRankMedalScreen = lazy(() =>
  import('../screens/DevRankMedalScreen').then((module) => ({
    default: module.DevRankMedalScreen,
  })),
);

type RootNav = NativeStackNavigationProp<RootStackParamList>;

function RunRoute() {
  const navigation = useNavigation<RootNav>();
  return <RunScreen onBack={() => navigation.goBack()} />;
}

function RunDetailRoute() {
  const navigation = useNavigation<RootNav>();
  const route = useRoute<RouteProp<RootStackParamList, 'RunDetail'>>();

  return (
    <RunDetailScreen
      onBack={() => navigation.goBack()}
      onDeleted={() => navigation.navigate('MainTabs', { screen: 'Feed' })}
      run={route.params.run}
    />
  );
}

function TeamMatchRoute() {
  const navigation = useNavigation<RootNav>();
  const route = useRoute<RouteProp<RootStackParamList, 'TeamMatch'>>();
  const matchId = route.params?.matchId;
  const readOnly = matchId != null;

  return (
    <View style={styles.screen}>
      <AppHeader
        left={<HeaderIconButton accessibilityLabel="Go back" icon="chevron-back" onPress={() => navigation.goBack()} />}
        right={
          readOnly ? (
            <HeaderIconButton accessibilityLabel="Share match" icon="share-outline" onPress={triggerMatchDetailShare} />
          ) : (
            <View style={styles.headerActions}>
              <HeaderIconButton accessibilityLabel="Team chat" icon="chatbubble-outline" onPress={() => {}} />
              <HeaderIconButton accessibilityLabel="More options" icon="ellipsis-vertical" onPress={() => {}} />
            </View>
          )
        }
        title="MATCH"
      />
      <TeamMatchScreen
        matchId={matchId}
        onOpenRunDetail={(run) => navigation.navigate('RunDetail', { run })}
        onRunPress={() => navigation.navigate('Run')}
      />
    </View>
  );
}

function SoloMatchRoute() {
  const navigation = useNavigation<RootNav>();
  const route = useRoute<RouteProp<RootStackParamList, 'SoloMatch'>>();
  const matchId = route.params?.matchId;
  const readOnly = matchId != null;

  return (
    <View style={styles.screen}>
      <AppHeader
        left={<HeaderIconButton accessibilityLabel="Go back" icon="chevron-back" onPress={() => navigation.goBack()} />}
        right={
          readOnly ? (
            <HeaderIconButton accessibilityLabel="Share match" icon="share-outline" onPress={triggerMatchDetailShare} />
          ) : (
            <HeaderIconButton accessibilityLabel="More options" icon="ellipsis-vertical" onPress={openSoloMatchMenu} />
          )
        }
        title="SOLO MATCH"
      />
      <SoloMatchScreen
        matchId={matchId}
        onOpenRunDetail={(run) => navigation.navigate('RunDetail', { run })}
        onQuit={() => navigation.navigate('MainTabs', { screen: 'Match' })}
        onRunPress={() => navigation.navigate('Run')}
      />
    </View>
  );
}

function TeamDetailRoute() {
  const navigation = useNavigation<RootNav>();
  const route = useRoute<RouteProp<RootStackParamList, 'TeamDetail'>>();
  const openProfile = useOpenProfile();

  return (
    <PublicTeamScreen onBack={() => navigation.goBack()} onOpenProfile={openProfile} teamId={route.params.teamId} />
  );
}

function SettingsRoute() {
  const navigation = useNavigation<RootNav>();

  return (
    <View style={styles.screen}>
      <AppHeader
        left={<HeaderIconButton accessibilityLabel="Go back" icon="chevron-back" onPress={() => navigation.goBack()} />}
        showBorder
        title="SETTINGS"
      />
      <SettingsScreen
        onBack={() => navigation.goBack()}
        onOpenBlockedUsers={() => navigation.navigate('BlockedUsers')}
      />
    </View>
  );
}

function UserProfileRoute() {
  const navigation = useNavigation<RootNav>();
  const route = useRoute<RouteProp<RootStackParamList, 'UserProfile'>>();

  return <UserProfileScreen onBack={() => navigation.goBack()} userId={route.params.userId} />;
}

function BlockedUsersRoute() {
  const navigation = useNavigation<RootNav>();
  return <BlockedUsersScreen onBack={() => navigation.goBack()} />;
}

function DevSoloMatchScreenshotRoute() {
  const navigation = useNavigation<RootNav>();
  return <DevSoloMatchScreenshotScreen onBack={() => navigation.goBack()} />;
}

function DevTeamScreenshotRoute() {
  const navigation = useNavigation<RootNav>();
  return <DevTeamScreenshotScreen onBack={() => navigation.goBack()} />;
}

function DevRankMedalRoute() {
  const navigation = useNavigation<RootNav>();
  return (
    <Suspense fallback={null}>
      <DevRankMedalScreen onBack={() => navigation.goBack()} />
    </Suspense>
  );
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen component={MainTabs} name="MainTabs" />
      <Stack.Screen component={RunRoute} name="Run" />
      <Stack.Screen component={RunDetailRoute} name="RunDetail" />
      <Stack.Screen component={TeamMatchRoute} name="TeamMatch" />
      <Stack.Screen component={SoloMatchRoute} name="SoloMatch" />
      <Stack.Screen component={TeamDetailRoute} name="TeamDetail" />
      <Stack.Screen component={SettingsRoute} name="Settings" />
      <Stack.Screen component={UserProfileRoute} name="UserProfile" />
      <Stack.Screen component={BlockedUsersRoute} name="BlockedUsers" />
      <Stack.Screen component={DevSoloMatchScreenshotRoute} name="DevSoloMatchScreenshot" />
      <Stack.Screen component={DevTeamScreenshotRoute} name="DevTeamScreenshot" />
      <Stack.Screen component={DevRankMedalRoute} name="DevRankMedal" />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
