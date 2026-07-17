import { ComponentType } from 'react';

import { MeScreen, TeamScreen } from '../screens';

export type AppRoute =
  | 'feed'
  | 'runDetail'
  | 'run'
  | 'match'
  | 'teamMatch'
  | 'soloMatch'
  | 'team'
  | 'topTeams'
  | 'me'
  | 'settings'
  | 'userProfile'
  | 'devSoloMatchScreenshot'
  | 'devTeamScreenshot';

type RouteConfig = {
  title: string;
  screen?: ComponentType;
  showFeedTabs: boolean;
  showMatchTabs?: boolean;
  showHeaderBorder?: boolean;
  hideChrome?: boolean;
};

export const ROUTES: Record<AppRoute, RouteConfig> = {
  feed: { title: 'FEED', showFeedTabs: true, showHeaderBorder: false },
  runDetail: { title: 'RUN', showFeedTabs: false, hideChrome: true },
  run: { title: 'RUN', showFeedTabs: false, hideChrome: true },
  match: {
    title: 'MATCHMAKING',
    showFeedTabs: false,
    showMatchTabs: true,
    showHeaderBorder: false,
  },
  teamMatch: {
    title: 'MATCH',
    showFeedTabs: false,
    showHeaderBorder: true,
  },
  soloMatch: {
    title: '1V1 MATCH',
    showFeedTabs: false,
    showHeaderBorder: true,
  },
  team: { title: 'TEAM', screen: TeamScreen, showFeedTabs: false, showHeaderBorder: true },
  topTeams: {
    title: 'TOP TEAMS',
    showFeedTabs: false,
    showHeaderBorder: true,
  },
  me: { title: 'ME', screen: MeScreen, showFeedTabs: false, showHeaderBorder: true },
  settings: { title: 'SETTINGS', showFeedTabs: false, showHeaderBorder: true },
  userProfile: { title: 'PROFILE', showFeedTabs: false, hideChrome: true },
  devSoloMatchScreenshot: { title: '1V1 MATCH', showFeedTabs: false, hideChrome: true },
  devTeamScreenshot: { title: 'TEAM', showFeedTabs: false, hideChrome: true },
};

export function isAppRoute(key: string): key is AppRoute {
  return key in ROUTES;
}
