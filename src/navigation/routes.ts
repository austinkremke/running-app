import { ComponentType } from 'react';

import { MeScreen, TeamScreen } from '../screens';

export type AppRoute = 'feed' | 'run' | 'match' | 'teamMatch' | 'team' | 'topTeams' | 'me';

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
  team: { title: 'TEAM', screen: TeamScreen, showFeedTabs: false, showHeaderBorder: true },
  topTeams: {
    title: 'TOP TEAMS',
    showFeedTabs: false,
    showHeaderBorder: true,
  },
  me: { title: 'ME', screen: MeScreen, showFeedTabs: false, showHeaderBorder: true },
};

export function isAppRoute(key: string): key is AppRoute {
  return key in ROUTES;
}
